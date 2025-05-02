#!/usr/bin/env python3
import asyncio
import json
import sys
import signal
import time
from stream_receiver import StreamReceiver
from inference_service import InferenceService
from db_writer import DBWriter
from api_server import APIServer
import queue
import threading
import os

# Set up queues for communication between components
frame_queue = queue.Queue(maxsize=30)  # Frames from camera to inference
result_queue = queue.Queue(maxsize=30)  # Inference results to DB writer
event_queue = queue.Queue()  # Events to be sent to clients

# Flag to signal threads to stop
stop_flag = threading.Event()

def signal_handler(sig, frame):
    """Handle termination signals gracefully"""
    print(json.dumps({"type": "log", "message": "Shutting down..."}))
    stop_flag.set()

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def print_json(data):
    """Print JSON data that can be captured by the Node.js server"""
    print(json.dumps(data), flush=True)

async def main():
    try:
        # Initialize components
        print_json({"type": "log", "message": "システム起動中"})
        
        # Start DB writer in a thread
        db_writer = DBWriter(result_queue, event_queue)
        db_thread = threading.Thread(target=db_writer.run, args=(stop_flag,))
        db_thread.daemon = True
        db_thread.start()
        
        # Start inference service in a thread
        inference_service = InferenceService(frame_queue, result_queue, event_queue)
        inference_thread = threading.Thread(target=inference_service.run, args=(stop_flag,))
        inference_thread.daemon = True
        inference_thread.start()
        
        # Start stream receiver in a thread
        stream_receiver = StreamReceiver(frame_queue, event_queue)
        stream_thread = threading.Thread(target=stream_receiver.run, args=(stop_flag,))
        stream_thread.daemon = True
        stream_thread.start()
        
        # Start API server for forwarding events
        api_server = APIServer(event_queue)
        server_thread = threading.Thread(target=api_server.run, args=(stop_flag,))
        server_thread.daemon = True
        server_thread.start()
        
        # Event monitoring loop
        while not stop_flag.is_set():
            try:
                if not event_queue.empty():
                    event = event_queue.get(block=False)
                    print_json(event)
                
                # Report system status periodically
                system_stats = {
                    "type": "system_stats",
                    "stats": {
                        "connectionState": "オンライン",
                        "wsStatus": "接続済",
                        "recognizedCount": f"{db_writer.get_item_count()} 個",
                        "queueStatus": f"{frame_queue.qsize()}/{frame_queue.maxsize}",
                        "modelInfo": inference_service.get_model_info(),
                        "inferenceSpeed": inference_service.get_inference_speed(),
                        "processingStatus": f"処理中: {inference_service.get_fps():.1f} フレーム/秒"
                    }
                }
                print_json(system_stats)
                await asyncio.sleep(1)
            except queue.Empty:
                await asyncio.sleep(0.1)
            except Exception as e:
                print_json({"type": "log", "message": f"エラー: {str(e)}"})
                await asyncio.sleep(1)
        
        # Wait for threads to finish
        print_json({"type": "log", "message": "システム停止中..."})
        db_thread.join(timeout=2)
        inference_thread.join(timeout=2)
        stream_thread.join(timeout=2)
        server_thread.join(timeout=2)
        
    except Exception as e:
        print_json({"type": "log", "message": f"致命的なエラー: {str(e)}"})
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
