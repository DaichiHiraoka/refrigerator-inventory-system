import json
import mysql.connector
import time
import queue
import os

class DBWriter:
    def __init__(self, result_queue, event_queue):
        self.result_queue = result_queue
        self.event_queue = event_queue
        self.conn = None
        self.cursor = None
        self.items_count = 0
    
    def connect_to_db(self):
        """Establish connection to MySQL database"""
        try:
            # Using drizzle for compatibility with the JS server
            # We'll just perform raw SQL queries here
            self.conn = mysql.connector.connect(
                host=os.environ.get('PGHOST', 'localhost'),
                user=os.environ.get('PGUSER', 'postgres'),
                password=os.environ.get('PGPASSWORD', ''),
                database=os.environ.get('PGDATABASE', 'postgres')
            )
            self.cursor = self.conn.cursor(dictionary=True)
            self.event_queue.put({"type": "log", "message": "データベース接続完了"})
            
            # Create table if not exists
            self.create_table()
            
            return True
        except Exception as e:
            self.event_queue.put({"type": "log", "message": f"データベース接続エラー: {str(e)}"})
            return False
    
    def create_table(self):
        """Create the fridge_items table if it doesn't exist"""
        try:
            create_table_query = """
            CREATE TABLE IF NOT EXISTS fridge_items (
                item_id SERIAL PRIMARY KEY,
                name VARCHAR(64) NOT NULL,
                first_seen TIMESTAMP NOT NULL,
                last_seen TIMESTAMP NOT NULL
            );
            """
            self.cursor.execute(create_table_query)
            self.conn.commit()
            self.event_queue.put({"type": "log", "message": "テーブルの準備完了"})
        except Exception as e:
            self.event_queue.put({"type": "log", "message": f"テーブル作成エラー: {str(e)}"})
    
    def run(self, stop_flag):
        """Run the DB writer in a loop"""
        # Connect to database
        if not self.connect_to_db():
            return
        
        try:
            # Update cache of item count
            self.update_item_count()
            
            # Main processing loop
            while not stop_flag.is_set():
                try:
                    # Get detection result from queue
                    detection = self.result_queue.get(timeout=1)
                    
                    # Process the detection (upsert to database)
                    self.process_detection(detection)
                    
                except queue.Empty:
                    # No items in queue, just continue
                    pass
                
                # Don't hog the CPU
                time.sleep(0.01)
        
        except Exception as e:
            self.event_queue.put({"type": "log", "message": f"DB処理エラー: {str(e)}"})
        
        finally:
            # Close database connection
            if self.conn is not None:
                self.cursor.close()
                self.conn.close()
                self.event_queue.put({"type": "log", "message": "データベース接続終了"})
    
    def process_detection(self, detection):
        """Process a detection by upserting to the database"""
        try:
            name = detection["name"]
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(detection["timestamp"]))
            
            # Check if item already exists
            query = "SELECT * FROM fridge_items WHERE name = %s"
            self.cursor.execute(query, (name,))
            existing_item = self.cursor.fetchone()
            
            if existing_item:
                # Update existing item's last_seen
                update_query = "UPDATE fridge_items SET last_seen = %s WHERE item_id = %s"
                self.cursor.execute(update_query, (timestamp, existing_item["item_id"]))
                self.conn.commit()
                
                # Send updated item to clients
                event_data = {
                    "type": "item_updated",
                    "item": {
                        "item_id": existing_item["item_id"],
                        "name": name,
                        "first_seen": existing_item["first_seen"].isoformat() if hasattr(existing_item["first_seen"], "isoformat") else str(existing_item["first_seen"]),
                        "last_seen": timestamp
                    },
                    "confidence": detection["confidence"],
                    "bbox": detection["bbox"]
                }
                self.event_queue.put(event_data)
            else:
                # Insert new item
                insert_query = "INSERT INTO fridge_items (name, first_seen, last_seen) VALUES (%s, %s, %s) RETURNING item_id"
                self.cursor.execute(insert_query, (name, timestamp, timestamp))
                new_id = self.cursor.lastrowid
                self.conn.commit()
                
                # Update item count
                self.items_count += 1
                
                # Send new item to clients
                event_data = {
                    "type": "item_added",
                    "item": {
                        "item_id": new_id,
                        "name": name,
                        "first_seen": timestamp,
                        "last_seen": timestamp
                    },
                    "confidence": detection["confidence"],
                    "bbox": detection["bbox"]
                }
                self.event_queue.put(event_data)
        
        except Exception as e:
            self.event_queue.put({"type": "log", "message": f"データベース更新エラー: {str(e)}"})
    
    def update_item_count(self):
        """Update the cached item count"""
        try:
            query = "SELECT COUNT(*) as count FROM fridge_items"
            self.cursor.execute(query)
            result = self.cursor.fetchone()
            if result:
                self.items_count = result["count"]
        except Exception as e:
            self.event_queue.put({"type": "log", "message": f"アイテム数取得エラー: {str(e)}"})
    
    def get_item_count(self):
        """Return the current item count"""
        return self.items_count
