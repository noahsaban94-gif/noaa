import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  Users,
  Package,
  Settings,
  ExternalLink,
  ShieldCheck,
  Truck,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { ActiveTab } from '../types';
import { NOA_AVATAR_IMAGE } from '../data/mockAndInitialData';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  ordersCount: number;
  unreadChatAlerts?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  ordersCount,
  unreadChatAlerts = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'סידור היום',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'schedule' as ActiveTab,
      label: 'סידור עבודה יומי',
      icon: CalendarDays,
      badge: ordersCount > 0 ? `${ordersCount}` : null,
    },
    {
      id: 'chat' as ActiveTab,
      label: 'נועה AI — צ׳אט וסדרנית',
      icon: MessageSquare,
      badge: unreadChatAlerts > 0 ? `+${unreadChatAlerts} סונכרן` : 'Live',
      isAi: true,
      hasAlert: unreadChatAlerts > 0,
    },
    {
      id: 'clients' as ActiveTab,
      label: 'לקוחות וקבלנים',
      icon: Users,
      badge: '28',
    },
    {
      id: 'deposits' as ActiveTab,
      label: 'ניהול פקדונות (בלות/משטחים)',
      icon: Package,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'הגדרות וסנכרון Sheets',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen win-mica border-l border-slate-200/80 p-4 select-none z-20">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">ח. סבן</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">1994 בע״מ</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">ניהול לוגיסטיקה ושינוע</p>
          </div>
        </div>
      </div>

      {/* Noa AI Status Card */}
      <div className="my-4 p-3 rounded-2xl bg-gradient-to-l from-blue-50/90 to-sky-50/70 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={NOA_AVATAR_IMAGE}
              alt="נועה AI"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-blue-400/40"
              onError={(e) => {
                // Fallback avatar if external image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h2 className="text-xs font-bold text-slate-900 truncate">נועה AI (SabanOS)</h2>
              <Sparkles className="w-3 h-3 text-blue-600 flex-shrink-0" />
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              מחוברת • סנכרון רציף
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto pt-1">
        <div className="px-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          תפריט מערכת
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                  : 'text-slate-700 hover:bg-slate-100/80 active:bg-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAi ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : (item as any).hasAlert
                      ? 'bg-emerald-500 text-white animate-pulse shadow-sm shadow-emerald-500/30'
                      : item.isAi
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & User Profile */}
      <div className="pt-3 border-t border-slate-200/70 space-y-2 text-xs">
        <a
          href="https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2 rounded-xl bg-slate-100/70 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition"
          title="פתח גיליון סידור עבודה המקורי ב-Google Sheets"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-[11px]">גיליון Google Sheet</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>

        <div className="p-2.5 rounded-xl bg-white/60 border border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              רמ
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs">ראמי מסארוה</p>
              <p className="text-[10px] text-slate-500">סדרן ומנהל תפעול ראשי</p>
            </div>
          </div>
          <a
            href="tel:0508860896"
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
            title="חייג לראמי"
          >
            <PhoneCall className="w-4 h-4" />
          </a>
        </div>
      </div>
    </aside>
  );
};
