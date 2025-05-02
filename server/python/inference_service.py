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
        self.device = "cpu"
        self.model_info = "OpenCV (CPU)"
        self.inference_times = []
        self.last_inference_time = 0
        self.processed_frames = 0
        self.start_time = time.time()
        self.fps = 0
        # Demo mode - simulate detection
        self.last_detection_time = time.time()
        self.detection_interval = 5  # seconds between detections
    
    def run(self, stop_flag):
        """Run the inference service in a loop"""
        self.event_queue.put({"type": "log", "message": "OpenCVモデル初期化中..."})
        
        try:
            # Simple demo mode message
            self.event_queue.put({"type": "log", "message": "GPUは未使用: デモモードでCPU実行"})
            self.model_info = "OpenCV (デモモード)"
            
            self.event_queue.put({"type": "log", "message": "モデル初期化完了"})
            
            # Main inference loop
            while not stop_flag.is_set():
                try:
                    # Get a frame from the queue
                    frame_data = self.frame_queue.get(timeout=1)
                    frame = frame_data["frame"]
                    timestamp = frame_data["timestamp"]
                    
                    # Simple processing - just measure time
                    start_time = time.time()
                    
                    # Apply basic OpenCV operations to simulate processing
                    gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
                    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
                    
                    # Demo detection - randomly detect items at intervals
                    current_time = time.time()
                    if current_time - self.last_detection_time > self.detection_interval:
                        self.last_detection_time = current_time
                        
                        # Get frame dimensions
                        h, w = frame.shape[:2]
                        
                        # Pick random food item
                        class_idx = random.randint(0, len(FOOD_CLASSES) - 1)
                        class_name = FOOD_CLASSES[class_idx]
                        class_name_ja = FOOD_TRANSLATIONS[class_name]
                        
                        # Random bounding box (25-75% of frame size)
                        box_w = random.uniform(0.25, 0.4) * w
                        box_h = random.uniform(0.25, 0.4) * h
                        box_x = random.uniform(0.1, 0.6) * w
                        box_y = random.uniform(0.1, 0.6) * h
                        
                        # Random confidence (70-95%)
                        confidence = random.uniform(0.7, 0.95)
                        
                        # Convert to percentage
                        bbox = {
                            "left": (box_x / w) * 100,
                            "top": (box_y / h) * 100,
                            "width": (box_w / w) * 100,
                            "height": (box_h / h) * 100
                        }
                        
                        # Create detection result
                        detection = {
                            "name": class_name_ja,
                            "confidence": int(confidence * 100),
                            "timestamp": timestamp,
                            "bbox": bbox
                        }
                        
                        try:
                            self.result_queue.put(detection, block=False)
                        except queue.Full:
                            # Skip if queue is full
                            pass
                    
                    # End timing
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
                
                except queue.Empty:
                    # No frames available, just continue
                    pass
                
                # Don't hog the CPU
                time.sleep(0.01)
        
        except Exception as e:
            self.event_queue.put({"type": "log", "message": f"推論エラー: {str(e)}"})
    
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
