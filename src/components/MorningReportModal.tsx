import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Send,
  Printer,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';

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
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 win-mica border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">דוח בוקר מבצעי — סידור עבודה יומי</h2>
              <p className="text-xs text-slate-500">{dateStr} • מוכן לשידור לקבוצת הנהגים</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-96 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
            {reportContent}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <span className="text-xs text-slate-500 font-medium">
              הדוח כולל את כל {orders.length} ההזמנות, כתובות, קישורי Waze ופקדונות.
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
      </div>
    </div>
  );
};
