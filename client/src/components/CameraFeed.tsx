import { Video, Cog, Expand, Microchip, Bolt } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCamera } from "@/hooks/useCamera";
import { DetectedItem } from "@/types";

interface CameraFeedProps {
  detectedItems: DetectedItem[];
  modelInfo: string;
  inferenceSpeed: string;
  processingStatus: string;
}

export default function CameraFeed({ 
  detectedItems, 
  modelInfo, 
  inferenceSpeed, 
  processingStatus 
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { stream, error } = useCamera();
  
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  const handleCameraSettings = () => {
    alert("カメラ設定は現在利用できません。");
  };
  
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Video className="mr-2 text-primary" />
          カメラフィード
        </h2>
        <div className="flex gap-2">
          <button 
            className="p-2 rounded bg-neutral-100 hover:bg-neutral-200 transition-colors" 
            title="カメラ設定"
            onClick={handleCameraSettings}
          >
            <Cog className="text-neutral-600 h-4 w-4" />
          </button>
          <button 
            className="p-2 rounded bg-neutral-100 hover:bg-neutral-200 transition-colors" 
            title="フルスクリーン"
            onClick={handleToggleFullscreen}
          >
            <Expand className="text-neutral-600 h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="relative aspect-video bg-neutral-800 rounded-lg overflow-hidden"
      >
        {stream ? (
          <video 
            ref={videoRef}
            className="w-full h-full object-cover" 
            autoPlay 
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {error ? (
              <div className="text-center p-4">
                <p className="mb-2 text-red-400">カメラを開けませんでした</p>
                <p className="text-sm">
                  {error || "カメラへのアクセス許可が必要です"}
                </p>
              </div>
            ) : (
              <p>カメラを起動中...</p>
            )}
          </div>
        )}
        
        {/* Detection overlay */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {detectedItems.map(item => (
            <div 
              key={item.id}
              className="absolute border-2 border-primary bg-primary/20 rounded-md" 
              style={{
                top: `${item.bbox.top}%`,
                left: `${item.bbox.left}%`,
                width: `${item.bbox.width}%`,
                height: `${item.bbox.height}%`
              }}
            >
              <div className="absolute -top-7 left-0 bg-primary text-white text-xs px-2 py-1 rounded-md">
                {item.name} ({item.confidence}%)
              </div>
            </div>
          ))}
        </div>
        
        {/* Processing indicator */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
          <span>{processingStatus}</span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-neutral-100 p-3 rounded">
          <div className="text-xs text-neutral-500 mb-1">モデル</div>
          <div className="text-sm font-medium flex items-center">
            <Microchip className="mr-1 text-primary h-4 w-4" />
            <span>{modelInfo}</span>
          </div>
        </div>
        <div className="bg-neutral-100 p-3 rounded">
          <div className="text-xs text-neutral-500 mb-1">推論速度</div>
          <div className="text-sm font-medium flex items-center">
            <Bolt className="mr-1 text-warning h-4 w-4" />
            <span>{inferenceSpeed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
