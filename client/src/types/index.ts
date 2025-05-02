// FridgeItem model
export interface FridgeItem {
  item_id: number;
  name: string;
  first_seen: string;
  last_seen: string;
}

// System statistics
export interface SystemStats {
  connectionState: string;
  wsStatus: string;
  recognizedCount: string;
  queueStatus: string;
  modelInfo: string;
  inferenceSpeed: string;
  processingStatus: string;
}

// Log message
export interface LogMessage {
  id: string;
  type: string;
  message: string;
  details: string;
  timestamp: Date;
}

// Notification
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
}

// Detected item with bounding box
export interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  bbox: {
    top: number;
    left: number;
    width: number;
    height: number;
  }
}
