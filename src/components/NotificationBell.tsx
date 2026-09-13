import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Trash2,
  Truck,
  ExternalLink,
  Package,
  Settings,
  Sparkles,
} from 'lucide-react';
import {
  LocalNotificationItem,
  getNotificationHistory,
  clearNotificationHistory,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  sendTestNotification,
  getNotificationSettings,
  saveNotificationSettings,
} from '../lib/notificationService';

interface NotificationBellProps {
  onOpenSettings?: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onOpenSettings,
  onSelectOrder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<LocalNotificationItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    'default'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load initial history & settings
  useEffect(() => {
    setNotifications(getNotificationHistory());
    setPermission(getBrowserNotificationPermission());
    setSoundEnabled(getNotificationSettings().soundEnabled);
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    const handleNotificationEvent = () => {
      setNotifications(getNotificationHistory());
      setPermission(getBrowserNotificationPermission());
    };

    window.addEventListener('saban_ready_notification', handleNotificationEvent);
    return () => {
      window.removeEventListener('saban_ready_notification', handleNotificationEvent);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const newPerm = await requestBrowserNotificationPermission();
    setPermission(newPerm);
  };

  const handleToggleSound = () => {
    const updated = !soundEnabled;
    setSoundEnabled(updated);
    saveNotificationSettings({ soundEnabled: updated });
  };

  const handleClearHistory = () => {
    clearNotificationHistory();
    setNotifications([]);
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 text-slate-700 transition active:scale-95 flex items-center justify-center"
        title="התראות הזמנה מוכנה להעמסה"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-sky-600 animate-pulse" />
        ) : (
          <Bell className="w-4 h-4 text-slate-600" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-40 animate-fade-in text-right">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">
                התראות מערכת ('מוכן להעמסה')
              </span>
              {notifications.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                  {notifications.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                onClick={handleToggleSound}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title={soundEnabled ? 'השתק צליל התראה' : 'הפעל צליל התראה'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-sky-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Clear History */}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="נקה היסטוריית התראות"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Browser Permission Banner */}
          <div className="mx-3 my-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {permission === 'granted' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-bold text-emerald-800 text-[11px]">
                      התראות דפדפן מאושרות
                    </span>
                  </>
                ) : permission === 'denied' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="font-bold text-rose-700 text-[11px]">
                      התראות חסומות בדפדפן
                    </span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="font-bold text-slate-700 text-[11px]">
                      אפשר התראות מקומיות
                    </span>
                  </>
                )}
              </div>

              {permission !== 'granted' && (
                <button
                  onClick={handleRequestPermission}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-xs active:scale-95 transition"
                >
                  הפעל עכשיו
                </button>
              )}
            </div>

            {/* Test Trigger Button */}
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">בדיקת התראה מיידית:</span>
              <button
                onClick={handleTestNotification}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 active:scale-95 transition"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>שלח התראת ניסיון 🔔</span>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto px-3 space-y-2 py-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Package className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs font-bold text-slate-500">אין התראות חדשות</p>
                <p className="text-[11px] text-slate-400">
                  כאשר סטטוס הזמנה ישתנה ל'מוכן להעמסה', תופיע כאן התראה מיידית
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/30 transition shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>{item.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-bold">
                        #{item.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{item.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Truck className="w-3 h-3 text-slate-400" />
                      {item.driver}
                    </span>
                    <span className="text-slate-400 truncate max-w-[130px]">{item.warehouse}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 truncate">
                    יעד: {item.destinationAddress}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Settings Link */}
          {onOpenSettings && (
            <div className="px-3 pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">התראות עבור מנהל ונהגים</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                <span>הגדרות התראה</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
