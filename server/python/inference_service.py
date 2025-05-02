import time
import queue
import json
import numpy as np
import os
import cv2
import random

# Food class labels
FOOD_CLASSES = [
    "apple", "banana", "orange", "carrot", "broccoli", "tomato", "egg",
    "cabbage", "milk", "bread", "cheese", "beef", "chicken", "fish", "rice"
]

# Japanese translations for food items
FOOD_TRANSLATIONS = {
    "apple": "りんご",
    "banana": "バナナ",
    "orange": "オレンジ",
    "carrot": "にんじん",
    "broccoli": "ブロッコリー",
    "tomato": "トマト",
    "egg": "卵",
    "cabbage": "キャベツ",
    "milk": "牛乳",
    "bread": "パン",
    "cheese": "チーズ",
    "beef": "牛肉",
    "chicken": "鶏肉",
    "fish": "魚",
    "rice": "米"
}

class InferenceService:
    def __init__(self, frame_queue, result_queue, event_queue):
        self.frame_queue = frame_queue
        self.result_queue = result_queue
        self.event_queue = event_queue
        self.model = None
        self.device = "cpu"
        self.model_info = "YOLOv8n (CPU)"
        self.inference_times = []
        self.last_inference_time = 0
        self.processed_frames = 0
        self.start_time = time.time()
        self.fps = 0
    
    def run(self, stop_flag):
        """Run the inference service in a loop"""
        self.event_queue.put({"type": "log", "message": "YOLOv8モデル読み込み中..."})
        
        try:
            # Check if GPU is available
            if torch.cuda.is_available():
                self.device = "cuda"
                self.model_info = f"YOLOv8n (CUDA GPU: {torch.cuda.get_device_name(0)})"
                self.event_queue.put({"type": "log", "message": f"CUDA GPUを検出: {torch.cuda.get_device_name(0)}"})
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                self.device = "mps"
                self.model_info = "YOLOv8n (MPS)"
                self.event_queue.put({"type": "log", "message": "Apple MPS (Metal)を検出"})
            else:
                self.event_queue.put({"type": "log", "message": "GPU未検出: CPU推論を使用"})
            
            # Load YOLOv8 model
            # Use small model for faster inference
            self.model = YOLO("yolov8n.pt")
            
            self.event_queue.put({"type": "log", "message": "YOLOv8モデル読み込み完了"})
            
            # Main inference loop
            while not stop_flag.is_set():
                try:
                    # Get a frame from the queue
                    frame_data = self.frame_queue.get(timeout=1)
                    frame = frame_data["frame"]
                    timestamp = frame_data["timestamp"]
                    
                    # Run inference
                    start_time = time.time()
                    results = self.model(frame, device=self.device, verbose=False)
                    inference_time = time.time() - start_time
                    
                    # Track inference time for metrics
                    self.inference_times.append(inference_time)
                    if len(self.inference_times) > 30:
                        self.inference_times.pop(0)
                    self.last_inference_time = inference_time
                    
                    # Update FPS calculation
                    self.processed_frames += 1
                    elapsed = time.time() - self.start_time
                    if elapsed >= 1.0:
                        self.fps = self.processed_frames / elapsed
                        self.processed_frames = 0
                        self.start_time = time.time()
                    
                    # Process results
                    for result in results:
                        boxes = result.boxes
                        
                        if len(boxes) > 0:
                            for box in boxes:
                                # Get class and confidence
                                cls_idx = int(box.cls.item())
                                conf = box.conf.item()
                                
                                # Filter results
                                if conf > 0.5 and cls_idx < len(result.names):
                                    class_name = result.names[cls_idx]
                                    
                                    # Only process food items
                                    if class_name in FOOD_CLASSES:
                                        # Translate to Japanese
                                        class_name_ja = FOOD_TRANSLATIONS.get(class_name, class_name)
                                        
                                        # Get bounding box
                                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                                        h, w = frame.shape[:2]
                                        
                                        # Convert to percentage for easier frontend handling
                                        bbox = {
                                            "left": (x1 / w) * 100,
                                            "top": (y1 / h) * 100,
                                            "width": ((x2 - x1) / w) * 100,
                                            "height": ((y2 - y1) / h) * 100
                                        }
                                        
                                        # Create detection result
                                        detection = {
                                            "name": class_name_ja,
                                            "confidence": int(conf * 100),
                                            "timestamp": timestamp,
                                            "bbox": bbox
                                        }
                                        
                                        try:
                                            self.result_queue.put(detection, block=False)
                                        except queue.Full:
                                            # Skip if queue is full
                                            pass
                
                except queue.Empty:
                    # No frames available, just continue
                    pass
                
                # Don't hog the CPU
                time.sleep(0.01)
        
        except Exception as e:
            self.event_queue.put({"type": "log", "message": f"推論エラー: {str(e)}"})
        
        finally:
            # Clean up model
            if self.model is not None:
                del self.model
                torch.cuda.empty_cache() if self.device == "cuda" else None
    
    def get_model_info(self):
        """Return model information"""
        return self.model_info
    
    def get_inference_speed(self):
        """Return average inference speed"""
        if not self.inference_times:
            return "0ms/フレーム"
        
        avg_time = sum(self.inference_times) / len(self.inference_times)
        return f"{int(avg_time * 1000)}ms/フレーム"
    
    def get_fps(self):
        """Return the current FPS rate"""
        return self.fps
