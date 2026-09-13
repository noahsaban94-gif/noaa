import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  Users,
  Package,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  ordersCount: number;
  unreadChatAlerts?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  ordersCount,
  unreadChatAlerts = 0,
}) => {
  const items = [
    { id: 'dashboard' as ActiveTab, label: 'לוח בקרה', icon: LayoutDashboard },
    { id: 'schedule' as ActiveTab, label: 'סידור יומי', icon: CalendarDays, badge: ordersCount },
    {
      id: 'chat' as ActiveTab,
      label: 'נועה AI',
      icon: MessageSquare,
      isChat: true,
      alertBadge: unreadChatAlerts > 0 ? unreadChatAlerts : undefined,
    },
    { id: 'clients' as ActiveTab, label: 'קבלנים', icon: Users },
    { id: 'deposits' as ActiveTab, label: 'פקדונות', icon: Package },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 win-mica border-t border-slate-200/80 px-2 flex items-center justify-around z-30 select-none shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {item.isChat && item.alertBadge && (
              <span className="absolute -top-1 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            )}
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'}`} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.alertBadge && (
                <span className="absolute -top-1.5 -left-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                  {item.alertBadge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
