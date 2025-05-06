import { Bell, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { LogMessage } from "@/types";
import { useState } from "react";

interface ActivityFeedProps {
  activities: LogMessage[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const [displayCount, setDisplayCount] = useState(3);
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new':
        return { icon: <Plus className="text-secondary" />, bgColor: 'bg-green-100' };
      case 'updated':
        return { icon: <RefreshCw className="text-warning" />, bgColor: 'bg-yellow-100' };
      case 'expired':
        return { icon: <AlertTriangle className="text-danger" />, bgColor: 'bg-red-100' };
      default:
        return { icon: <Bell className="text-primary" />, bgColor: 'bg-blue-100' };
    }
  };
  
  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 3, activities.length));
  };
  
  const visibleActivities = activities.slice(0, displayCount);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Bell className="mr-2 text-primary" />
        アクティビティ
      </h2>
      
      <div className="space-y-3">
        {visibleActivities.length > 0 ? (
          visibleActivities.map(activity => {
            const { icon, bgColor } = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start p-3 rounded-lg border border-neutral-200">
                <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center mr-3 flex-shrink-0`}>
                  {icon}
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{activity.message}</div>
                  <div className="text-sm text-neutral-500">{activity.details}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-3 text-center text-neutral-500">
            アクティビティはありません
          </div>
        )}
      </div>
      
      {activities.length > displayCount && (
        <button 
          className="w-full mt-4 px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          onClick={handleLoadMore}
        >
          さらに読み込む
        </button>
      )}
    </div>
  );
}
