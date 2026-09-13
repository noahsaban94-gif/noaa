import React, { useState } from 'react';
import {
  MapPin,
  Truck,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  Navigation,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Package,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  AlertTriangle,
  Building2,
  Check,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { getPublicTrackingUrl, getVercelTrackingUrl, VERCEL_APP_URL, GITHUB_REPO_URL } from '../utils/urlUtils';
import { CustomerNoaChat } from './CustomerNoaChat';
import { MiniNoaAssistant } from './MiniNoaAssistant';

export interface CustomerTrackingViewProps {
  order: Order;
  allOrders?: Order[];
  onSelectOrder?: (order: Order) => void;
  onBack?: () => void;
  isStandalone?: boolean;
  onUpdateOrder?: (updatedOrder: Order) => void;
}

// 4 official stages requested: ⏳ בהמתנה / ⚙️ בהכנה / 🚗 בדרך / ✅ סופקה
export type ClientTrackingStage = 'pending' | 'preparing' | 'on_the_way' | 'delivered';

export const mapStatusToStage = (status: OrderStatus): ClientTrackingStage => {
  switch (status) {
    case 'בסידור עבודה':
      return 'pending';
    case 'מוכן להעמסה':
    case 'בטעינה במחסן':
      return 'preparing';
    case 'בדרך ללקוח':
      return 'on_the_way';
    case 'נמסר באתר':
      return 'delivered';
    case 'חריגה / עיכוב':
    default:
      return 'on_the_way';
  }
};

export const STAGES_CONFIG: {
  key: ClientTrackingStage;
  label: string;
  emoji: string;
  subtext: string;
  detailedText: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}[] = [
  {
    key: 'pending',
    label: 'בהמתנה',
    emoji: '⏳',
    subtext: 'נקלטה בסידור העבודה',
    detailedText: 'ההזמנה שובצה בסידור העבודה היומי וממתינה לפתיחת קו ליקוט והעמסה במחסן.',
    activeBg: 'bg-amber-500',
    activeText: 'text-amber-700',
    activeBorder: 'border-amber-300',
  },
  {
    key: 'preparing',
    label: 'בהכנה',
    emoji: '⚙️',
    subtext: 'בליקוט וטעינה במחסן',
    detailedText: 'צוות המחסן מלקט את המוצרים ומעמיס על גבי המשאית בהתאם להנחיות הבטיחות.',
    activeBg: 'bg-blue-600',
    activeText: 'text-blue-700',
    activeBorder: 'border-blue-300',
  },
  {
    key: 'on_the_way',
    label: 'בדרך',
    emoji: '🚗',
    subtext: 'הנהג בנסיעה לאתר',
    detailedText: 'המשאית יצאה מהמחסן ונמצאת בנסיעה ישירה אל כתובת האתר שלך.',
    activeBg: 'bg-indigo-600',
    activeText: 'text-indigo-700',
    activeBorder: 'border-indigo-300',
  },
  {
    key: 'delivered',
    label: 'סופקה',
    emoji: '✅',
    subtext: 'נפרקה ונמסרה באתר',
    detailedText: 'ההזמנה נמסרה ונפרקה בהצלחה לשביעות רצון הלקוח באתר היעד.',
    activeBg: 'bg-emerald-600',
    activeText: 'text-emerald-700',
    activeBorder: 'border-emerald-300',
  },
];

export const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({
  order,
  allOrders,
  onSelectOrder,
  onBack,
  isStandalone = false,
  onUpdateOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedVercel, setCopiedVercel] = useState(false);
  const [copiedWaze, setCopiedWaze] = useState(false);

  const currentStage = mapStatusToStage(order.status);
  const currentStageIdx = STAGES_CONFIG.findIndex((s) => s.key === currentStage);
  const isDelayed = order.status === 'חריגה / עיכוב';

  // Driver phone lookup
  const driverPhone = order.driver.includes('חכמת')
    ? '050-8860897'
    : order.driver.includes('עלי')
    ? '050-8860898'
    : '050-8860896';

  const driverShortName = order.driver.includes('חכמת')
    ? 'חכמת (מרצדס מנוף)'
    : order.driver.includes('עלי')
    ? 'עלי (משאית איסוזו)'
    : order.driver;

  const sabanPhone = '09-7440023';
  const sabanContactPerson = 'ראמי מסארוה / מוקד שירות לקוחות';

  // Raw Waze link to target address
  const rawWazeUrl =
    order.wazeUrl ||
    `https://www.waze.com/ul?q=${encodeURIComponent(order.destinationAddress)}&navigate=yes`;

  // Magic Link on Vercel Production deployment requested by user
  const vercelMagicUrl = getVercelTrackingUrl(order.orderNumber);
  // Active host tracking URL
  const trackingPageUrl = getPublicTrackingUrl(order.orderNumber, false);

  // Copy Vercel Magic Link
  const handleCopyVercelLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(vercelMagicUrl);
      setCopiedVercel(true);
      setTimeout(() => setCopiedVercel(false), 2500);
    }
  };

  // Copy tracking link
  const handleCopyTrackingLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(vercelMagicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Copy raw Waze link
  const handleCopyWazeUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(rawWazeUrl);
      setCopiedWaze(true);
      setTimeout(() => setCopiedWaze(false), 2500);
    }
  };

  // Share formatted message via WhatsApp
  const currentStageInfo = STAGES_CONFIG.find((s) => s.key === currentStage) || STAGES_CONFIG[0];
  const shareWhatsAppMessage = `שלום ${order.clientName} 🌹\n` +
    `מצורף לינק קסם למעקב חי עבור הזמנה מס' *#${order.orderNumber}* מחברת *ח. סבן חומרי בניין (1994) בע"מ*:\n\n` +
    `⚡ *סטטוס עדכני:* ${currentStageInfo.emoji} *${currentStageInfo.label}* (${currentStageInfo.subtext})\n` +
    `📅 *מועד אספקה:* ${order.date || 'היום'} | ${order.roundAndTime}\n` +
    `📍 *יעד:* ${order.destinationAddress}\n` +
    `🚚 *נהג משובץ:* ${driverShortName}\n` +
    `📦 *פירוט מוצרים:* ${order.productsSummary}\n` +
    `🛡️ *פקדונות:* ${order.depositsSummary}\n\n` +
    `🪄 *לינק קסם למעקב חי וצ'אט שירות עם נועה AI:*\n${vercelMagicUrl}\n\n` +
    `📍 *קישור Waze לכתובת:*\n${rawWazeUrl}\n\n` +
    `לכל שאלה, תוספת להזמנה או שינוי: פנה לנועה AI בצ'אט או חייג לסדרן ראמי מסארוה: 050-8860896`;

  const whatsAppShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareWhatsAppMessage)}`;

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-100 text-slate-900 font-sans antialiased text-right pb-16">
      {/* Top Brand Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="חזרה לסידור העבודה"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-sm font-black text-base tracking-tight">
                ח.ס
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                    ח. סבן חומרי בניין (1994) בע״מ
                  </h1>
                </div>
                <p className="text-[11px] text-blue-200/90 font-medium">
                  דף מעקב הזמנה ומשלוח בזמן אמת • SabanOS
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTrackingLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
              title="העתק קישור ישיר לדף המעקב"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'הועתק!' : 'העתק קישור'}</span>
            </button>

            <a
              href={whatsAppShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
              title="שתף קישור ישירות בוואטסאפ של הלקוח"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">שתף בוואטסאפ</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* VERCEL MAGIC LINK & GITHUB REPO BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 text-white shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-white">לינק קסם למעקב לקוח (Vercel)</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                    פעיל ונגיש ציבורית ⚡
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 font-mono dir-ltr text-right">
                  {vercelMagicUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyVercelLink}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition shadow-xs active:scale-95"
                title="העתק לינק קסם של Vercel ללוח"
              >
                {copiedVercel ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedVercel ? 'הועתק ללוח!' : 'העתק לינק קסם 🪄'}</span>
              </button>

              <a
                href={vercelMagicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                title="פתח את דף המעקב ב-Vercel"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">פתח ב-Vercel</span>
              </a>

              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                title="מאגר קוד פתוח ב-GitHub"
              >
                <span className="text-xs">🐙</span>
                <span className="hidden sm:inline">מאגר GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* Customer Switcher (if viewed by dispatcher with allOrders, hidden in standalone customer mode) */}
        {!isStandalone && allOrders && allOrders.length > 1 && onSelectOrder && (
          <div className="p-2.5 bg-white/80 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">בחירת הזמנה להצגה:</span>
              <select
                value={order.id}
                onChange={(e) => {
                  const target = allOrders.find((o) => o.id === e.target.value);
                  if (target) onSelectOrder(target);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {allOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.orderNumber} — {o.clientName} ({o.destinationAddress})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-400">
              מציג הזמנה {allOrders.findIndex((o) => o.id === order.id) + 1} מתוך {allOrders.length}
            </span>
          </div>
        )}

        {/* VIEW TABS: Digital Delivery Note vs Interactive Noa AI Chat */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
              activeTab === 'details'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>תעודת משלוח ומעקב שלבים 🚚</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 relative ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-blue-50/60'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>צ'אט שירות עם נועה AI 🌹</span>
            <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              תכולה • תוספות • ביטול
            </span>
          </button>
        </div>

        {/* ACTIVE TAB CONTENT */}
        {activeTab === 'chat' ? (
          <div className="space-y-4">
            <CustomerNoaChat order={order} onUpdateOrder={onUpdateOrder} />
            
            {/* Quick Helper Banner */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-700 font-medium">
                  בקשות תוספת ושינויים המאושרות בצ'אט מועברות ישירות לצוות המחסן בניהול ראמי מסארוה.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="text-blue-600 font-bold hover:underline shrink-0"
              >
                חזרה לפרטי המשלוח ⬅
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* HERO CARD: Prominent Order Number & Greeting */}
            <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-black tracking-wide uppercase mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>תעודת משלוח דיגיטלית</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    שלום, {order.clientName} 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    המשלוח שלך מסודר ומנוהל בזמן אמת במערכת הלוגיסטית של ח. סבן.
                  </p>
                </div>

                {/* Prominent Order Number Badge */}
                <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl text-center sm:text-left flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border border-slate-800 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    מספר הזמנה
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-400 tracking-wider font-mono">
                    #{order.orderNumber}
                  </span>
                </div>
              </div>

              {/* Pending Requests Alert */}
              {order.customerRequests && order.customerRequests.length > 0 && (
                <div className="mt-4 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-extrabold block">בקשות לקוח פעילות:</span>
                      {order.customerRequests.map((req) => (
                        <span key={req.id} className="block mt-0.5 text-blue-800">
                          • {req.content} ({new Date(req.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 shrink-0"
                  >
                    פתח צ'אט
                  </button>
                </div>
              )}

              {/* Delay banner if applicable */}
              {isDelayed && (
                <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">עדכון עיכוב בשטח:</span> קיים עיכוב זמני עקב עומסי תנועה או פריקה באתר סמוך. הנהג עושה את מירב המאמצים להגיע בהקדם האפשרי.
                  </div>
                </div>
              )}
            </section>

        {/* 4-STAGE OFFICIAL TRACKING STATUS */}
        <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>סטטוס משלוח עדכני</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {currentStageInfo.emoji} {currentStageInfo.label}
              </span>
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>עודכן: לפני רגעים ספורים</span>
            </div>
          </div>

          {/* Stepper Progress Bar: ⏳ בהמתנה / ⚙️ בהכנה / 🚗 בדרך / ✅ סופקה */}
          <div className="relative pt-2 pb-4">
            {/* Horizontal Line behind steps */}
            <div className="hidden sm:block absolute top-7 right-8 left-8 h-1 bg-slate-200 -z-0">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{
                  width: `${(currentStageIdx / (STAGES_CONFIG.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 relative z-10">
              {STAGES_CONFIG.map((stage, idx) => {
                const isPassed = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                const isFuture = idx > currentStageIdx;

                return (
                  <div
                    key={stage.key}
                    className={`flex flex-col items-center text-center p-3 rounded-2xl transition-all ${
                      isCurrent
                        ? 'bg-blue-50/80 border-2 border-blue-500/80 shadow-xs'
                        : isPassed
                        ? 'bg-slate-50/60 border border-slate-200/80'
                        : 'bg-white border border-slate-100 opacity-60'
                    }`}
                  >
                    {/* Circle Icon Badge */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black transition-all mb-2 ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100 scale-105'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isPassed ? <Check className="w-5 h-5" /> : stage.emoji}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`text-xs sm:text-sm font-extrabold ${
                            isCurrent
                              ? 'text-blue-900'
                              : isPassed
                              ? 'text-emerald-800'
                              : 'text-slate-500'
                          }`}
                        >
                          {stage.label}
                        </span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {stage.subtext}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Stage Description Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-sky-50/50 border border-blue-100 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              {currentStageInfo.emoji}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-blue-950">
                שלב נוכחי: {currentStageInfo.label} — {currentStageInfo.subtext}
              </h4>
              <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
                {currentStageInfo.detailedText}
              </p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE NOA AI BANNER IN DETAILS */}
        <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/60 border border-blue-400/50 flex items-center justify-center text-xl shrink-0 shadow-xs">
              🌹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">נועה AI — עוזרת אישית למשלוח זה</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  מענה חי 24/7
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                שאל על תכולת ההזמנה, בקש תוספת פריטים דחופה להעמסה, או עדכן על ביטול/שינוי.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>פתח צ'אט עם נועה AI 💬</span>
          </button>
        </section>

        {/* DELIVERY & LOCATION DETAILS + RAW WAZE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: Delivery Date, Address & Destination */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                מועד ויעד האספקה
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">תאריך אספקה:</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {order.date ? new Date(order.date).toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'היום (לפי סידור עבודה)'}
                  </span>
                  <span className="text-[11px] text-blue-600 font-bold block mt-0.5">
                    {order.roundAndTime || 'סבב בוקר מוקדם'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">כתובת פריקה ויעד:</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {order.destinationAddress}
                  </span>
                  {order.city && (
                    <span className="text-[11px] text-slate-500 font-medium block">
                      עיר: {order.city}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">מחסן מנפק:</span>
                  <span className="font-bold text-slate-700">
                    {order.warehouse || '🏭 מחסן 4 (החרש) — חומרי בניין כבדים'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Driver Details & Contacts */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                נהג משובץ ואיש קשר
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Driver info */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">נהג משאית</span>
                    <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                      {driverShortName}
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${driverPhone}`}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>חייג לנהג</span>
                </a>
              </div>

              {/* Saban Main Contact Person */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">סדרן ראשי / מוקד שירות</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {sabanContactPerson}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${sabanPhone}`}
                    className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
                    title="חייג למוקד ח. סבן"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://wa.me/972508860896"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition"
                    title="שלח וואטסאפ לסדרן"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RAW WAZE LINK SECTION (REQUIRED BY USER) */}
        <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                קישור Waze גולמי לכתובת היעד
              </h3>
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              ניווט מדויק ישירות לנקודת הפריקה
            </span>
          </div>

          {/* Raw Link Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 font-mono text-xs text-slate-700 select-all overflow-x-auto whitespace-nowrap text-left dir-ltr">
              {rawWazeUrl}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyWazeUrl}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-95"
                title="העתק את כתובת ה-URL של Waze ללוח"
              >
                {copiedWaze ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWaze ? 'קישור הועתק!' : 'העתק קישור Waze'}</span>
              </button>

              <a
                href={rawWazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-xs transition active:scale-95"
                title="פתח אפליקציית Waze"
              >
                <Navigation className="w-4 h-4" />
                <span>פתח Waze</span>
              </a>
            </div>
          </div>
        </section>

        {/* PRODUCTS SUMMARY & DETAILS */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                פירוט מוצרים וכמויות להזמנה #{order.orderNumber}
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
              {order.productsSummary}
            </div>
          </div>

          {order.notes && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
              <span className="font-bold shrink-0">הערות תפעוליות:</span>
              <span>{order.notes}</span>
            </div>
          )}
        </section>

        {/* DEPOSITS (פקדונות: בלות / משטחים) */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                חיוב וניהול פקדונות (בלות / משטחים)
              </h3>
            </div>

            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              נוהל סבן מאושר
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">פירוט פקדונות לתעודה:</span>
              <span className="font-black text-slate-900 text-sm sm:text-base">
                {order.depositsSummary || 'פטור מפקדון'}
              </span>
            </div>

            <div className="text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/80 max-w-sm">
              💡 <strong>חשוב לדעת:</strong> זיכוי כספי מלא יוענק עם החזרת הבלות (מק"ט 60002) או המשטחים (מק"ט 60060) במצב תקין ע"י הנהג או בסניפי ח. סבן.
            </div>
          </div>
        </section>

        {/* FOOTER ACTIONS & SHARE */}
        <section className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm sm:text-base font-black text-white">
              זקוקים לשינוי או פריקה מיוחדת?
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              צוות ח. סבן לשירותך בכל שעה. חייגו 09-7440023 או פנו לסדרן ראמי.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>צ'אט עם נועה AI</span>
            </button>
            <a
              href={`tel:${sabanPhone}`}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-black shadow-xs hover:bg-slate-100 transition active:scale-95"
            >
              חייג למוקד
            </a>
            <a
              href={whatsAppShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>שלח דף מעקב</span>
            </a>
          </div>
        </section>
      </div>
    )}
  </main>

  {/* Miniaturized Noa AI Assistant Window (Specialized Intent Recognition for this Order) */}
  {activeTab === 'details' && (
    <MiniNoaAssistant
      order={order}
      onUpdateOrder={onUpdateOrder}
      onExpandToFullChat={() => setActiveTab('chat')}
    />
  )}
</div>
);
};
