import { Box } from "lucide-react";

interface HeaderProps {
  connectionStatus: string;
  onResetSystem: () => void;
}

export default function Header({ connectionStatus, onResetSystem }: HeaderProps) {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Box className="mr-2 text-xl" />
          <h1 className="text-xl font-semibold">冷蔵庫内容物追跡システム</h1>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-400 mr-2 animate-pulse"></div>
            <span className="text-sm">{connectionStatus}</span>
          </div>
          <button 
            className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors text-sm"
            onClick={onResetSystem}
          >
            リセット
          </button>
        </div>
      </div>
    </header>
  );
}
