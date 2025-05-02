import { Server, Code } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-white py-4">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} 冷蔵庫内容物追跡システム
        </div>
        <div className="flex space-x-4 text-sm">
          <span className="text-neutral-400">
            <Server className="inline-block mr-1 h-4 w-4" />
            <span>API: v1.0.0</span>
          </span>
          <span className="text-neutral-400">
            <Code className="inline-block mr-1 h-4 w-4" />
            <span>UI: v1.0.0</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
