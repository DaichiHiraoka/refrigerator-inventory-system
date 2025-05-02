import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { FridgeItem } from "@shared/schema";

// Get current file path for ES modules (replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store active WebSocket connections
const clients = new Set<WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);
    
    // Send initial system state
    const initialState = {
      type: 'system_stats',
      stats: {
        connectionState: "オンライン",
        wsStatus: "接続済",
        recognizedCount: "0 個",
        queueStatus: "0/10",
        modelInfo: "YOLOv8n (GPU)",
        inferenceSpeed: "0ms/フレーム",
        processingStatus: "初期化中...",
      }
    };
    
    ws.send(JSON.stringify(initialState));
    
    // Handle client messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.action === 'reset_system') {
          // Restart Python processes
          pyProcess?.kill();
          startPythonProcess();
          
          // Notify clients
          broadcastMessage({
            type: 'log',
            message: 'システムリセットを実行中...'
          });
        }
        
        if (data.action === 'refresh_inventory') {
          try {
            const items = await storage.getAllItems();
            broadcastMessage({
              type: 'refresh_complete',
              items
            });
          } catch (error) {
            console.error('Error refreshing inventory:', error);
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('Client disconnected');
      clients.delete(ws);
    });
  });
  
  // REST API routes
  app.get('/api/items', async (req, res) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  });
  
  // Start Python process
  let pyProcess: ReturnType<typeof spawn> | null = null;
  
  function startPythonProcess() {
    const pythonPath = process.env.NODE_ENV === 'production' 
      ? 'python' 
      : 'python3';
      
    const scriptPath = path.join(__dirname, 'python', 'main.py');
    
    pyProcess = spawn(pythonPath, [scriptPath]);
    
    // TypeScript null check for stdout
    if (pyProcess && pyProcess.stdout) {
      pyProcess.stdout.on('data', (data) => {
        try {
          const message = data.toString().trim();
          console.log(`Python stdout: ${message}`);
          
          // Try to parse JSON messages
          try {
            const jsonData = JSON.parse(message);
            if (jsonData.type) {
              broadcastMessage(jsonData);
            }
          } catch (e) {
            // Not JSON, just a log message
            broadcastMessage({
              type: 'log',
              message: message
            });
          }
        } catch (error) {
          console.error('Error processing Python output:', error);
        }
      });
    }
    
    // TypeScript null check for stderr
    if (pyProcess && pyProcess.stderr) {
      pyProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
        broadcastMessage({
          type: 'log',
          message: `エラー: ${data}`
        });
      });
    }
    
    if (pyProcess) {
      pyProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (code !== 0) {
          broadcastMessage({
            type: 'log',
            message: `Python プロセスが終了しました (コード: ${code})`
          });
        }
        
        // Restart the process if it crashed
        if (code !== 0 && code !== null) {
          setTimeout(() => {
            console.log('Restarting Python process...');
            startPythonProcess();
          }, 5000);
        }
      });
    }
  }
  
  // Start the Python process when the server starts
  startPythonProcess();
  
  // Application is shutting down
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (pyProcess) {
      pyProcess.kill();
    }
    process.exit();
  });
  
  return httpServer;
}

// Broadcast message to all connected clients
function broadcastMessage(message: any) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}
