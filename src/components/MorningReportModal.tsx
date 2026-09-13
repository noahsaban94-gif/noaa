import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Send,
  Printer,
  Sparkles,
  Volume2,
  FileText,
  Headphones
} from 'lucide-react';
import { Order } from '../types';
import { VoiceSummaryPlayer } from './VoiceSummaryPlayer';

interface MorningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const MorningReportModal: React.FC<MorningReportModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const dateStr = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reportContent = `ח. סבן חומרי בניין (1994) בע"מ — דוח בוקר מבצעי וסידור עבודה יומי 🚚\n` +
    `תאריך: ${dateStr} | הופק ע"י נועה AI (SabanOS)\n` +
    `סה"כ משימות בסידור: ${orders.length}\n` +
    `-----------------------------------------\n\n` +
    orders
      .map(
        (o, idx) =>
          `📍 *תחנה ${idx + 1} (${o.roundAndTime})* | הזמנה: #${o.orderNumber}\n` +
          `• לקוח: ${o.clientName} ${o.clientPhone ? `(${o.clientPhone})` : ''}\n` +
          `• יעד: ${o.destinationAddress}\n` +
          `• נהג: ${o.driver}\n` +
          `• מחסן מקור: ${o.warehouse}\n` +
          `• מוצרים: ${o.productsSummary}\n` +
          `• פקדונות: ${o.depositsSummary}\n` +
          `• סטטוס: ${o.status}\n` +
          (o.notes ? `• הערות: ${o.notes}\n` : '') +
          `• ניווט Waze: ${o.wazeUrl}`
      )
      .join('\n\n-----------------------------------------\n\n') +
    `\n\nבאהבה ובשירותיות, נועה ❤️ | סדרנית ויד ימינו של ראמי`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(reportContent)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in text-right">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 win-mica border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/20">
              {activeTab === 'voice' ? (
                <Headphones className="w-5 h-5 text-white" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  דוח בוקר מבצעי — סידור עבודה יומי
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  <span>נועה AI קולית</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">{dateStr} • {orders.length} משימות אספקה</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switch buttons */}
            <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  activeTab === 'voice'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>תדריך קולי 🎙️</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  activeTab === 'text'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>דוח טקסט וואטסאפ</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              title="סגור"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'voice' ? (
            /* Voice Summary Player with Female Voice Options */
            <VoiceSummaryPlayer orders={orders} dateStr={dateStr} />
          ) : (
            /* Text Report and Broadcast View */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900">
                <span className="font-bold">דוח מובנה מוכן להעתקה ושידור מהיר לקבוצת הוואטסאפ של הנהגים</span>
                <span className="font-mono font-black">{orders.length} תחנות</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-96 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                {reportContent}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <span className="text-xs text-slate-500 font-medium">
                  הדוח כולל את כל הזמנות היום, כתובות, קישורי Waze ופירוט פקדונות.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'הועתק ללוח!' : 'העתק טקסט'}</span>
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>שדר לוואטסאפ (קבוצת נהגים)</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 win-mica border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>נועה AI — מערכת ניהול סידור עבודה ח. סבן חומרי בניין (1994) בע"מ</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100 transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
