import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CameraFeed from "@/components/CameraFeed";
import SystemStatus from "@/components/SystemStatus";
import InventorySummary from "@/components/InventorySummary";
import ActivityFeed from "@/components/ActivityFeed";
import Notifications from "@/components/Notifications";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";
import { FridgeItem, SystemStats, LogMessage, Notification, DetectedItem } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    connectionState: "オフライン",
    wsStatus: "未接続",
    recognizedCount: "0 個",
    queueStatus: "0/0",
    modelInfo: "YOLOv8n (GPU)",
    inferenceSpeed: "0ms/フレーム",
    processingStatus: "待機中",
  });
  
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  
  // Fetch initial items
  const { data: initialItems } = useQuery<FridgeItem[]>({
    queryKey: ['/api/items'],
  });
  
  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
    }
  }, [initialItems]);

  const onMessage = (data: any) => {
    const parsedData = JSON.parse(data);
    
    if (parsedData.type === 'item_added' || parsedData.type === 'item_updated') {
      // Update items list
      setItems(prev => {
        const updatedItems = [...prev];
        const existingIndex = updatedItems.findIndex(item => item.item_id === parsedData.item.item_id);
        
        if (existingIndex >= 0) {
          updatedItems[existingIndex] = parsedData.item;
        } else {
          updatedItems.push(parsedData.item);
        }
        
        return updatedItems;
      });
      
      // Add to activity log
      const logType = parsedData.type === 'item_added' ? 'new' : 'updated';
      const newLog: LogMessage = {
        id: Date.now().toString(),
        type: logType,
        message: `${logType === 'new' ? '新アイテム検出' : 'アイテム再検出'}: ${parsedData.item.name}`,
        details: `信頼度: ${parsedData.confidence}% • ${new Date().toLocaleString()}`,
        timestamp: new Date()
      };
      setLogs(prev => [newLog, ...prev].slice(0, 20));
      
      // Add detection
      if (parsedData.bbox) {
        const newDetection: DetectedItem = {
          id: Date.now().toString(),
          name: parsedData.item.name,
          confidence: parsedData.confidence,
          bbox: parsedData.bbox
        };
        setDetectedItems([newDetection]);
        
        // Clear detection after 2 seconds
        setTimeout(() => {
          setDetectedItems([]);
        }, 2000);
      }
    } else if (parsedData.type === 'system_stats') {
      setStats(parsedData.stats);
    } else if (parsedData.type === 'log') {
      const newLog: LogMessage = {
        id: Date.now().toString(),
        type: 'system',
        message: parsedData.message,
        details: new Date().toLocaleString(),
        timestamp: new Date()
      };
      setLogs(prev => [newLog, ...prev].slice(0, 20));
    }
  };
  
  const { connectionStatus, sendMessage } = useWebSocket({
    onMessage,
    onOpen: () => {
      setStats(prev => ({
        ...prev,
        connectionState: "オンライン",
        wsStatus: "接続済"
      }));
      
      const newLog: LogMessage = {
        id: Date.now().toString(),
        type: 'system',
        message: 'WebSocket接続完了',
        details: new Date().toLocaleString(),
        timestamp: new Date()
      };
      setLogs(prev => [newLog, ...prev].slice(0, 20));
    },
    onClose: () => {
      setStats(prev => ({
        ...prev,
        connectionState: "オフライン",
        wsStatus: "未接続"
      }));
    }
  });
  
  const handleResetSystem = () => {
    sendMessage(JSON.stringify({ action: 'reset_system' }));
  };
  
  const handleRefreshInventory = () => {
    sendMessage(JSON.stringify({ action: 'refresh_inventory' }));
  };
  
  // Check for expiring items and create notifications
  useEffect(() => {
    if (items.length > 0) {
      const currentDate = new Date();
      const expiringItems = items.filter(item => {
        const lastSeen = new Date(item.last_seen);
        const daysDiff = Math.floor((currentDate.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 5 && daysDiff < 7; // Items that have been in the fridge for 5-7 days
      });
      
      const expiredItems = items.filter(item => {
        const lastSeen = new Date(item.last_seen);
        const daysDiff = Math.floor((currentDate.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 7; // Items that have been in the fridge for 7+ days
      });
      
      if (expiringItems.length > 0) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'warning',
          title: `期限間近の食材が${expiringItems.length}つあります`,
          message: `${expiringItems.map(item => item.name).join(', ')} • あと${7 - 5}日`,
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 5));
      }
      
      if (expiredItems.length > 0) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'danger',
          title: `期限切れの食材が${expiredItems.length}つあります`,
          message: `${expiredItems.map(item => item.name).join(', ')} • 期限切れ`,
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 5));
      }
    }
  }, [items]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        connectionStatus={connectionStatus} 
        onResetSystem={handleResetSystem} 
      />
      
      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-5/12 flex flex-col gap-6">
          <CameraFeed 
            detectedItems={detectedItems}
            modelInfo={stats.modelInfo}
            inferenceSpeed={stats.inferenceSpeed}
            processingStatus={stats.processingStatus}
          />
          <SystemStatus 
            stats={stats}
            logs={logs}
          />
        </div>
        
        <div className="w-full lg:w-7/12 flex flex-col gap-6">
          <InventorySummary 
            items={items}
            onRefresh={handleRefreshInventory}
          />
          <ActivityFeed 
            activities={logs}
          />
        </div>
      </main>
      
      <Footer />
      
      <Notifications 
        notifications={notifications}
        onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />
    </div>
  );
}
