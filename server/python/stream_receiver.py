import cv2
import time
import queue
import threading
import json

class StreamReceiver:
    def __init__(self, frame_queue, event_queue):
        self.frame_queue = frame_queue
        self.event_queue = event_queue
        self.camera = None
        self.frame_count = 0
        self.start_time = time.time()
        self.fps = 0
    
    def run(self, stop_flag):
        """Run the stream receiver in a loop"""
        self.event_queue.put({"type": "log", "message": "カメラ接続中..."})
        
        try:
            # Try to open the camera
            self.camera = cv2.VideoCapture(0)  # Use default camera
            if not self.camera.isOpened():
                self.event_queue.put({"type": "log", "message": "エラー: カメラが見つかりません"})
                return
            
            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            self.camera.set(cv2.CAP_PROP_FPS, 15)
            
            self.event_queue.put({"type": "log", "message": "カメラ接続完了"})
            
            # Main loop to read frames
            while not stop_flag.is_set():
                ret, frame = self.camera.read()
                
                if not ret:
                    self.event_queue.put({"type": "log", "message": "警告: フレーム取得失敗"})
                    time.sleep(0.1)
                    continue
                
                # Update FPS calculation
                self.frame_count += 1
                elapsed_time = time.time() - self.start_time
                if elapsed_time >= 1.0:  # Update FPS every second
                    self.fps = self.frame_count / elapsed_time
                    self.frame_count = 0
                    self.start_time = time.time()
                
                # Try to add frame to queue, skip if queue is full
                try:
                    # Convert to RGB for model input
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frame_data = {
                        "frame": rgb_frame,
                        "timestamp": time.time()
                    }
                    self.frame_queue.put(frame_data, block=False)
                except queue.Full:
                    # Skip frame if queue is full
                    pass
                
                # Don't hog the CPU
                time.sleep(0.01)
        
        except Exception as e:
            self.event_queue.put({"type": "log", "message": f"カメラエラー: {str(e)}"})
        
        finally:
            # Release resources
            if self.camera is not None and self.camera.isOpened():
                self.camera.release()
                self.event_queue.put({"type": "log", "message": "カメラ接続解除"})
    
    def get_fps(self):
        """Return the current FPS rate"""
        return self.fps
