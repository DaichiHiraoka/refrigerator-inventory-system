import json
import queue
import time
import threading
import asyncio
import websockets
import os

class APIServer:
    def __init__(self, event_queue):
        self.event_queue = event_queue
        self.clients = set()
    
    def run(self, stop_flag):
        """Run the API server in a separate thread"""
        self.event_queue.put({"type": "log", "message": "WebSocket サーバー起動中..."})
        
        # API server uses a simpler approach since it just forwards events
        # Node.js handles the actual WebSocket server, we just send events to stdout
        self.event_queue.put({"type": "log", "message": "WebSocket サーバー準備完了"})
        
        # Main loop - forward events to stdout
        while not stop_flag.is_set():
            try:
                # Sleep to avoid high CPU usage
                time.sleep(0.1)
            except Exception as e:
                self.event_queue.put({"type": "log", "message": f"APIサーバーエラー: {str(e)}"})
