import React from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Send,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNewOrder: () => void;
  onOpenMorningReport: () => void;
  onSyncSheet: () => void;
  isSyncing: boolean;
  onOpenChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenNewOrder,
  onOpenMorningReport,
  onSyncSheet,
  isSyncing,
  onOpenChat,
}) => {
  return (
    <header className="h-16 win-mica border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Search Input */}
      <div className="flex-1 max-w-md relative ml-4">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש הזמנה, שם לקוח, כתובת, נהג..."
          className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pr-10 pl-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition"
        />
      </div>

      {/* Action Buttons & Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Google Sheet Sync Status */}
        <button
          onClick={onSyncSheet}
          disabled={isSyncing}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-700 transition active:scale-95"
          title="סנכרן נתונים מול Google Sheet בזמן אמת"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>סנכרון Sheet</span>
        </button>

        {/* Morning Report Button */}
        <button
          onClick={onOpenMorningReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 text-xs font-bold transition active:scale-95"
          title="הפק דוח בוקר מבצעי לוואטסאפ"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">דוח בוקר 🚚</span>
          <span className="sm:hidden">דוח בוקר</span>
        </button>

        {/* Quick Noa Chat Button */}
        <button
          onClick={onOpenChat}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-800 text-xs font-bold hover:bg-blue-100 transition active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>נועה AI</span>
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* New Order Button */}
        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>הזמנה חדשה</span>
        </button>
      </div>
    </header>
  );
};
