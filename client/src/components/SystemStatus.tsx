import { 
  ChartLine, 
  CircleCheckBig, 
  Wifi, 
  Apple, 
  ListCheck 
} from "lucide-react";
import { SystemStats, LogMessage } from "@/types";

interface SystemStatusProps {
  stats: SystemStats;
  logs: LogMessage[];
}

export default function SystemStatus({ stats, logs }: SystemStatusProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <ChartLine className="mr-2 text-primary" />
        システム状態
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-neutral-100 p-3 rounded">
          <div className="text-xs text-neutral-500 mb-1">接続状態</div>
          <div className="text-sm font-medium flex items-center">
            <CircleCheckBig className="mr-1 text-secondary h-4 w-4" />
            <span>{stats.connectionState}</span>
          </div>
        </div>
        <div className="bg-neutral-100 p-3 rounded">
          <div className="text-xs text-neutral-500 mb-1">WebSocket</div>
          <div className="text-sm font-medium flex items-center">
            <Wifi className="mr-1 text-secondary h-4 w-4" />
            <span>{stats.wsStatus}</span>
          </div>
        </div>
        <div className="bg-neutral-100 p-3 rounded">
          <div className="text-xs text-neutral-500 mb-1">認識アイテム</div>
          <div className="text-sm font-medium flex items-center">
            <Apple className="mr-1 text-primary h-4 w-4" />
            <span>{stats.recognizedCount}</span>
          </div>
        </div>
        <div className="bg-neutral-100 p-3 rounded">
          <div className="text-xs text-neutral-500 mb-1">キュー状態</div>
          <div className="text-sm font-medium flex items-center">
            <ListCheck className="mr-1 text-primary h-4 w-4" />
            <span>{stats.queueStatus}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">ログ</h3>
        <div className="bg-neutral-800 text-neutral-100 p-3 rounded text-xs font-mono h-32 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map(log => (
              <div key={log.id}>[{new Date(log.timestamp).toLocaleString()}] {log.message}</div>
            ))
          ) : (
            <div>システムログなし</div>
          )}
        </div>
      </div>
    </div>
  );
}
