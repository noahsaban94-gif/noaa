import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  MapPin,
  X,
  ExternalLink,
  MessageSquare,
  Building2,
  CheckCircle2,
  BellRing,
} from 'lucide-react';
import { LocalNotificationItem } from '../lib/notificationService';
import { Order } from '../types';

interface ToastState {
  notification: LocalNotificationItem;
  order: Order;
  visible: boolean;
}

interface NotificationToastProps {
  onSelectOrder?: (orderId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ onSelectOrder }) => {
  const [currentToast, setCurrentToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const handleNotificationEvent = (event: any) => {
      const { notification, order } = event.detail || {};
      if (notification && order) {
        setCurrentToast({
          notification,
          order,
          visible: true,
        });
      }
    };

    window.addEventListener('saban_ready_notification', handleNotificationEvent);
    return () => {
      window.removeEventListener('saban_ready_notification', handleNotificationEvent);
    };
  }, []);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!currentToast || !currentToast.visible) return;

    const timer = setTimeout(() => {
      setCurrentToast((prev) => (prev ? { ...prev, visible: false } : null));
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentToast]);

  if (!currentToast || !currentToast.visible) return null;

  const { notification, order } = currentToast;

  // Pre-filled WhatsApp notification to driver
  const driverName = order.driver.includes('חכמת') ? 'חכמת' : order.driver.includes('עלי') ? 'עלי' : order.driver;
  const whatsappText = encodeURIComponent(
    `שלום ${driverName},\nהזמנה מס׳ ${order.orderNumber} עבור ${order.clientName} מוכנה כעת להעמסה במחסן:\n📍 ${order.warehouse}\nיעד פריקה: ${order.destinationAddress} (${order.city || ''})\nסטטוס: מוכן להעמסה 🚚`
  );

  return (
    <div
      className="fixed top-5 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-50 w-[92vw] sm:w-[420px] max-w-md animate-bounce-short shadow-2xl"
      dir="rtl"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-sky-500/50 p-4 shadow-2xl shadow-sky-950/40 relative overflow-hidden">
        {/* Animated accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 animate-pulse" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-tight text-white">
                  הזמנה מוכנה להעמסה!
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-300 font-mono text-[11px] font-bold border border-sky-400/40">
                  #{notification.orderNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                התראת מנהל לוגיסטי ושיבוץ נהג
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentToast((prev) => (prev ? { ...prev, visible: false } : null))}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="סגור התראה"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Details */}
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">לקוח:</span>
            <strong className="text-white font-bold">{notification.clientName}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">נהג משובץ:</span>
            <span className="font-bold text-sky-300 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              {notification.driver}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">מחסן העמסה:</span>
            <span className="font-medium text-slate-200">{notification.warehouse}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">כתובת יעד:</span>
            <span className="text-slate-300 truncate max-w-[220px]">
              {notification.destinationAddress}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>הודע לנהג בוואטסאפ</span>
          </a>

          {onSelectOrder && (
            <button
              onClick={() => {
                onSelectOrder(notification.orderId);
                setCurrentToast((prev) => (prev ? { ...prev, visible: false } : null));
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1"
            >
              <span>צפה בהזמנה</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
