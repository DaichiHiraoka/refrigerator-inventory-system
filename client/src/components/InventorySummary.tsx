import { useState } from "react";
import { 
  ClipboardList, 
  Apple, 
  RefreshCw, 
  Check, 
  Clock, 
  AlertTriangle,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { FridgeItem } from "@/types";

interface InventorySummaryProps {
  items: FridgeItem[];
  onRefresh: () => void;
}

export default function InventorySummary({ items, onRefresh }: InventorySummaryProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Calculate days since last seen to determine status
  const getItemStatus = (item: FridgeItem) => {
    const lastSeen = new Date(item.last_seen);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 7) return { status: 'expired', label: '期限切れ', className: 'bg-red-100 text-danger' };
    if (daysDiff >= 5) return { status: 'expiring', label: '期限間近', className: 'bg-yellow-100 text-warning' };
    return { status: 'fresh', label: '新鮮', className: 'bg-green-100 text-secondary' };
  };
  
  // Filter items based on active tab
  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    const status = getItemStatus(item).status;
    return status === activeTab;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Item counts by status
  const freshItems = items.filter(item => getItemStatus(item).status === 'fresh').length;
  const expiringItems = items.filter(item => getItemStatus(item).status === 'expiring').length;
  const expiredItems = items.filter(item => getItemStatus(item).status === 'expired').length;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <ClipboardList className="mr-2 text-primary" />
          在庫サマリー
        </h2>
        <div className="flex gap-2">
          <div className="text-sm bg-neutral-100 px-3 py-1 rounded-full flex items-center">
            <Apple className="mr-1 text-secondary h-4 w-4" />
            <span>合計: {items.length} アイテム</span>
          </div>
          <button 
            className="p-2 rounded bg-primary text-white hover:bg-primary/90 transition-colors flex items-center" 
            title="更新" 
            onClick={onRefresh}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            <span className="text-sm">更新</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 border border-secondary/30 p-3 rounded-lg flex items-center">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mr-3">
            <Check className="text-secondary" />
          </div>
          <div>
            <div className="text-xs text-neutral-500">新鮮</div>
            <div className="text-lg font-semibold text-secondary">{freshItems}</div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-warning/30 p-3 rounded-lg flex items-center">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center mr-3">
            <Clock className="text-warning" />
          </div>
          <div>
            <div className="text-xs text-neutral-500">期限間近</div>
            <div className="text-lg font-semibold text-warning">{expiringItems}</div>
          </div>
        </div>
        <div className="bg-red-50 border border-danger/30 p-3 rounded-lg flex items-center">
          <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center mr-3">
            <AlertTriangle className="text-danger" />
          </div>
          <div>
            <div className="text-xs text-neutral-500">期限切れ</div>
            <div className="text-lg font-semibold text-danger">{expiredItems}</div>
          </div>
        </div>
      </div>
      
      <div className="flex mb-4 border-b border-neutral-200">
        <button 
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-neutral-500 hover:text-neutral-800'
          }`}
          onClick={() => {
            setActiveTab('all');
            setCurrentPage(1);
          }}
        >
          すべて
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'expiring' ? 'border-b-2 border-primary text-primary' : 'text-neutral-500 hover:text-neutral-800'
          }`}
          onClick={() => {
            setActiveTab('expiring');
            setCurrentPage(1);
          }}
        >
          期限間近
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'expired' ? 'border-b-2 border-primary text-primary' : 'text-neutral-500 hover:text-neutral-800'
          }`}
          onClick={() => {
            setActiveTab('expired');
            setCurrentPage(1);
          }}
        >
          期限切れ
        </button>
      </div>
      
      <div className="relative overflow-x-auto rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="text-xs bg-neutral-100">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">食材名</th>
              <th scope="col" className="px-4 py-3 font-medium">初回検出</th>
              <th scope="col" className="px-4 py-3 font-medium">最終検出</th>
              <th scope="col" className="px-4 py-3 font-medium">状態</th>
              <th scope="col" className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map(item => {
                const { label, className } = getItemStatus(item);
                return (
                  <tr key={item.item_id} className="bg-white border-b hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{new Date(item.first_seen).toLocaleString()}</td>
                    <td className="px-4 py-3 text-neutral-600">{new Date(item.last_seen).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${className}`}>{label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-neutral-500 hover:text-neutral-700">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="bg-white border-b">
                <td colSpan={5} className="px-4 py-3 text-center text-neutral-500">
                  アイテムがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {filteredItems.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-neutral-500">
            {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)} / {filteredItems.length} アイテム
          </div>
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 rounded bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              className="px-3 py-1 rounded bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
