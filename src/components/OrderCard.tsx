import React, { useState } from 'react';
import {
  MapPin,
  Truck,
  Building2,
  Package,
  ShieldCheck,
  Send,
  Navigation,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Phone,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { checkBelaDepositAlert } from '../utils/orderValidation';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  onEditOrder?: (order: Order) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenClientPortfolio?: (clientName: string) => void;
}

const MAIN_STATUSES: OrderStatus[] = [
  'בסידור עבודה',
  'מוכן להעמסה',
  'בטעינה במחסן',
  'בדרך ללקוח',
  'נמסר באתר',
];

const SHORT_STATUS_LABELS: Record<OrderStatus, string> = {
  'בסידור עבודה': 'בסידור',
  'מוכן להעמסה': 'מוכן',
  'בטעינה במחסן': 'בטעינה',
  'בדרך ללקוח': 'בדרך',
  'נמסר באתר': 'נמסר',
  'חריגה / עיכוב': 'עיכוב',
};

const NEXT_STATUS_MAP: Partial<Record<OrderStatus, OrderStatus>> = {
  'בסידור עבודה': 'מוכן להעמסה',
  'מוכן להעמסה': 'בטעינה במחסן',
  'בטעינה במחסן': 'בדרך ללקוח',
  'בדרך ללקוח': 'נמסר באתר',
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  'בסידור עבודה': {
    label: 'בסידור עבודה',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Clock,
  },
  'מוכן להעמסה': {
    label: 'מוכן להעמסה',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: Package,
  },
  'בטעינה במחסן': {
    label: 'בטעינה במחסן',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Truck,
  },
  'בדרך ללקוח': {
    label: 'בדרך ללקוח',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Navigation,
  },
  'נמסר באתר': {
    label: 'סופק בהצלחה',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  'חריגה / עיכוב': {
    label: 'חריגה / עיכוב',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: AlertTriangle,
  },
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateStatus,
  onDeleteOrder,
  onEditOrder,
  isSelected = false,
  onToggleSelect,
  onOpenClientPortfolio,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG['בסידור עבודה'];
  const StatusIcon = statusInfo.icon;

  const isCrane = order.driver.includes('חכמת') || order.driver.includes('מנוף');
  const isExempt = order.depositsSummary === 'פטור';
  const belaAlert = checkBelaDepositAlert(order);
  const nextStatus = NEXT_STATUS_MAP[order.status];

  // Driver phone lookup
  const driverPhone = isCrane ? '0520000005' : '0520000006';
  const driverShortName = isCrane ? 'חכמת' : 'עלי';

  // WhatsApp Message Generator
  const generateWhatsAppLink = () => {
    const message = `🚚 *ח. סבן — כרטיס משימה להזמנה #${order.orderNumber}*\n` +
      `👤 לקוח: ${order.clientName}\n` +
      `📍 יעד: ${order.destinationAddress}\n` +
      `🏢 מחסן מקור: ${order.warehouse}\n` +
      `📦 פריטים לפריקה: ${order.productsSummary}\n` +
      `🛡️ פקדונות: ${order.depositsSummary}\n` +
      `🗺️ ניווט Waze:\n${order.wazeUrl}\n\n` +
      `נא לאשר תחילת נסיעה וסיום פריקה. יום מוצלח! 👍`;

    return `https://api.whatsapp.com/send?phone=972${driverPhone.slice(1)}&text=${encodeURIComponent(message)}`;
  };

  return (
    <div
      className={`win-card win-card-hover rounded-2xl p-4.5 flex flex-col justify-between transition relative text-right ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/20 shadow-md shadow-blue-500/10'
          : ''
      }`}
    >
      {/* Top Bar: Selection Checkbox + Round Badge + Order Number + Status Tag */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {onToggleSelect && (
              <label
                className="cursor-pointer flex items-center justify-center p-0.5"
                title={isSelected ? 'בטל בחירה למסלול ניווט מרוכז' : 'בחר הזמנה למסלול ניווט מרוכז (Bulk Navigate)'}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(order.id)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
              </label>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/80">
              {order.roundAndTime}
            </span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              #{order.orderNumber}
            </span>
          </div>

          {/* Status Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
              title="לחץ לבחירה ושינוי סטטוס תעודה"
            >
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{statusInfo.label}</span>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${showStatusMenu ? 'rotate-180' : ''}`} />
            </button>

            {showStatusMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowStatusMenu(false)}
                />
                <div className="absolute left-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-fade-in text-xs divide-y divide-slate-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-slate-50/70 flex items-center justify-between">
                    <span>בחר סטטוס חדש:</span>
                    <span className="font-mono text-blue-700">#{order.orderNumber}</span>
                  </div>
                  <div className="py-1">
                    {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((st) => {
                      const cfg = STATUS_CONFIG[st];
                      const Icon = cfg.icon;
                      const isCurrent = order.status === st;

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            onUpdateStatus(order.id, st);
                            setShowStatusMenu(false);
                          }}
                          className={`w-full text-right px-3 py-2 hover:bg-slate-50 transition flex items-center justify-between gap-2 ${
                            isCurrent ? 'font-black text-blue-700 bg-blue-50/60' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded-lg ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                              <Icon className="w-3 h-3" />
                            </span>
                            <span className="text-xs">{cfg.label}</span>
                          </div>
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bela Deposit Alert Badge (באג אדום למניעת טעויות חיוב / סף משטח) */}
        {belaAlert.hasAlert && (
          <div
            className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 text-right shadow-2xs transition animate-fade-in"
            title={belaAlert.reason}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="p-1 rounded-lg bg-red-600 text-white shadow-xs shrink-0 mt-0.5 animate-pulse">
                  <AlertOctagon className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-red-900">
                      התראת חיוב: בלות ללא פיקדון!
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-red-600 text-white shadow-2xs">
                      {belaAlert.isExempt ? 'מסומן פטור' : belaAlert.isEmpty ? 'שדה ריק' : 'חסר מק״ט 60002'}
                    </span>
                  </div>
                  <p className="text-[11px] text-red-700 mt-0.5 leading-snug font-medium">
                    ההזמנה כוללת בלות אך הפיקדון לא חויב. יש לוודא אישור חריג או עמידה בסף מינימום משטח למניעת טעויות חיוב.
                  </p>
                </div>
              </div>

              {onEditOrder && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditOrder(order);
                  }}
                  className="shrink-0 px-2 py-1 rounded-lg bg-white hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold shadow-2xs transition active:scale-95"
                  title="פתח לבדיקת חיוב ועריכת ההזמנה"
                >
                  בדיקת חיוב
                </button>
              )}
            </div>
          </div>
        )}

        {/* Client & Destination */}
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <h3
                onClick={() => onOpenClientPortfolio?.(order.clientName)}
                className={`text-sm font-extrabold text-slate-900 truncate ${
                  onOpenClientPortfolio ? 'cursor-pointer hover:text-blue-600 hover:underline transition' : ''
                }`}
                title={onOpenClientPortfolio ? `לחץ לפתיחת תיק לקוח CRM עבור ${order.clientName}` : undefined}
              >
                {order.clientName}
              </h3>
              {onOpenClientPortfolio && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenClientPortfolio(order.clientName);
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition shrink-0"
                  title="פתיחת תיק לקוח והצלבת הזמנות"
                >
                  תיק לקוח
                </button>
              )}
            </div>
            {order.clientPhone && (
              <a
                href={`tel:${order.clientPhone}`}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold shrink-0"
                title="חייג ללקוח"
              >
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">{order.clientPhone}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span className="truncate font-medium">{order.destinationAddress}</span>
          </div>
        </div>

        {/* Drivers & Warehouse badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Driver Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              isCrane ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{order.driver}</span>
          </span>

          {/* Warehouse Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{order.warehouse}</span>
          </span>
        </div>

        {/* Products Summary */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
          <p className="text-slate-500 text-[10px] font-bold mb-1">פירוט מוצרים וכמויות:</p>
          <p className="font-semibold text-slate-800 leading-relaxed">{order.productsSummary}</p>
        </div>

        {/* Deposits Badge */}
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px] font-semibold">פקדונות:</span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {belaAlert.hasAlert && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10.5px] shadow-2xs animate-pulse"
                title={belaAlert.reason}
              >
                <AlertTriangle className="w-3 h-3 text-white shrink-0" />
                <span>חסר פיקדון בלות!</span>
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                belaAlert.hasAlert
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : isExempt
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-teal-50 text-teal-800 border border-teal-200'
              }`}
            >
              {order.depositsSummary || 'ריק'}
            </span>
          </div>
        </div>

        {order.notes && (
          <p className="mt-2 text-[11px] text-amber-700 bg-amber-50/70 px-2 py-1 rounded border border-amber-200/50">
            💡 {order.notes}
          </p>
        )}

        {/* Quick Status Stepper (שינוי סטטוס מהיר בקליק אחד) */}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5 text-[11px]">
            <span className="font-bold text-slate-500">שינוי סטטוס מהיר:</span>
            {nextStatus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(order.id, nextStatus);
                }}
                className="text-[10.5px] font-black text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 px-2 py-0.5 rounded-lg transition active:scale-95 inline-flex items-center gap-1 shadow-2xs"
                title={`העבר לסטטוס הבא: ${STATUS_CONFIG[nextStatus].label}`}
              >
                <span>קדם: {SHORT_STATUS_LABELS[nextStatus]}</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {MAIN_STATUSES.map((st, idx) => {
              const isCurrent = order.status === st;
              const currentIndex = MAIN_STATUSES.indexOf(order.status as any);
              const isPast = currentIndex !== -1 && idx < currentIndex;
              const Icon = STATUS_CONFIG[st].icon;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(order.id, st);
                  }}
                  className={`py-1.5 px-0.5 rounded-lg text-[10.5px] font-bold transition flex flex-col items-center justify-center gap-0.5 text-center relative ${
                    isCurrent
                      ? `${STATUS_CONFIG[st].bg} ${STATUS_CONFIG[st].text} border ${STATUS_CONFIG[st].border} shadow-xs ring-1.5 ring-blue-500/40 font-black scale-[1.02]`
                      : isPast
                      ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/50'
                      : 'text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-2xs'
                  }`}
                  title={`העבר ישירות לסטטוס: ${STATUS_CONFIG[st].label}`}
                >
                  <Icon className={`w-3 h-3 ${isCurrent ? 'scale-110' : ''}`} />
                  <span className="truncate w-full leading-tight">{SHORT_STATUS_LABELS[st]}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Footer: Waze + WhatsApp Direct Dispatch + Menu */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Direct Waze Button */}
          <a
            href={order.wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 transition"
            title="פתח ניווט בוויז ישירות לכתובת היעד"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-600" />
            <span>Waze</span>
          </a>

          {/* WhatsApp Direct Broadcast to Driver */}
          <a
            href={generateWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 transition active:scale-95"
            title={`שדר כרטיס משימה ישירות לוואטסאפ של ${driverShortName}`}
          >
            <Send className="w-3 h-3" />
            <span>שדר ל{driverShortName}</span>
          </a>
        </div>

        {/* Manage buttons */}
        <div className="flex items-center gap-1">
          {onEditOrder && (
            <button
              onClick={() => onEditOrder(order)}
              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
              title="ערוך פרטי הזמנה"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              if (confirm(`האם למחוק את הזמנה #${order.orderNumber} של ${order.clientName}?`)) {
                onDeleteOrder(order.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
            title="מחק הזמנה"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
