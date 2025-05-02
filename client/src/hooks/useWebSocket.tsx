import { useState, useEffect, useCallback, useRef } from "react";

interface UseWebSocketProps {
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket({ onMessage, onOpen, onClose }: UseWebSocketProps = {}) {
  const [connectionStatus, setConnectionStatus] = useState<string>("接続中...");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Close the existing socket if there is one
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    // Clear any existing reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Use the correct WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    try {
      // Create new WebSocket connection
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      
      ws.onopen = () => {
        console.log("WebSocket connection established");
        setConnectionStatus("システム接続中");
        if (onOpen) onOpen();
      };
      
      ws.onmessage = (event: MessageEvent) => {
        console.log("WebSocket message received:", event.data);
        if (onMessage) onMessage(event.data);
      };
      
      ws.onclose = (event: CloseEvent) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setConnectionStatus("再接続中...");
        if (onClose) onClose();
        
        // Try to reconnect after a delay
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      ws.onerror = (event: Event) => {
        console.error("WebSocket error:", event);
        setConnectionStatus("接続エラー");
      };
      
    } catch (err) {
      console.error("Error creating WebSocket:", err);
      setConnectionStatus("接続エラー");
      
      // Try to reconnect after a delay
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  }, [onMessage, onOpen, onClose]);
  
  // Initialize WebSocket connection on component mount
  useEffect(() => {
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);
  
  // Send message through WebSocket
  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
      return true;
    }
    console.warn("WebSocket is not connected, message not sent");
    return false;
  }, []);
  
  return {
    connectionStatus,
    sendMessage,
    reconnect: connectWebSocket
  };
}
