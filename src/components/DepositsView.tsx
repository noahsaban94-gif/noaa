import React, { useState } from 'react';
import {
  Package,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  FileCheck,
  Search,
  Plus,
  Filter
} from 'lucide-react';
import { Order } from '../types';
import { checkBelaDepositAlert } from '../utils/orderValidation';

interface DepositsViewProps {
  orders: Order[];
}

export const DepositsView: React.FC<DepositsViewProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all_deposits' | 'discrepancies' | 'exempts'>('all_deposits');

  // Identify orders with missing Bela deposits (the requested red alert check)
  const discrepancyOrders = orders.filter((o) => checkBelaDepositAlert(o).hasAlert);

  // Extract orders with active deposits
  const depositOrders = orders.filter((o) => {
    return o.depositsSummary && o.depositsSummary !== 'פטור';
  });

  const exemptOrders = orders.filter((o) => o.depositsSummary === 'פטור');

  // Base list depending on filter tab
  const baseOrders =
    activeFilter === 'discrepancies'
      ? discrepancyOrders
      : activeFilter === 'exempts'
      ? exemptOrders
      : depositOrders;

  const filtered = baseOrders.filter((o) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.clientName.toLowerCase().includes(q) ||
      o.orderNumber.includes(q) ||
      o.depositsSummary.toLowerCase().includes(q) ||
      (o.productsSummary && o.productsSummary.toLowerCase().includes(q))
    );
  });

  // Calculate overall totals from active deposits
  let totalBags = 0;
  let totalPallets = 0;
  depositOrders.forEach((o) => {
    const bagMatch = o.depositsSummary.match(/(\d+)\s*בלות/);
    if (bagMatch) totalBags += parseInt(bagMatch[1], 10);

    const palletMatch = o.depositsSummary.match(/(\d+)\s*משטחי סבן/);
    if (palletMatch) totalPallets += parseInt(palletMatch[1], 10);
  });

  return (
    <div className="space-y-4 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 win-card rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">ניהול פקדונות ובקרת חיובים</h2>
            <p className="text-xs text-slate-500 font-medium">
              בקרת בלות (מק"ט 60002), משטחי סבן (מק"ט 60060) ומניעת טעויות חיוב / סף משטח
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חיפוש קבלן, הזמנה או מוצרים..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      {/* Discrepancy Banner if any orders have uncharged balot */}
      {discrepancyOrders.length > 0 && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-red-600 text-white shrink-0 animate-pulse">
              <AlertOctagon className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-black text-red-900">
                  התראת בקרת חיוב: זוהו {discrepancyOrders.length} תעודות עם בלות ללא חיוב פיקדון!
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px]">
                  בדיקת סף משטח / פטור
                </span>
              </div>
              <p className="text-[11px] text-red-700 mt-0.5">
                ההזמנות כוללות שקי בלה (חול, סומסום, טיט) אך הפיקדון מסומן כ'פטור' או ריק. יש לוודא שלא נפלה טעות ברישום.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveFilter('discrepancies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeFilter === 'discrepancies'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white hover:bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            {activeFilter === 'discrepancies' ? 'מוצגות התראות' : 'הצג תעודות חריגות'}
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Red Discrepancy KPI Card */}
        <div
          onClick={() => setActiveFilter('discrepancies')}
          className={`p-4 win-card rounded-2xl cursor-pointer transition ${
            activeFilter === 'discrepancies'
              ? 'ring-2 ring-red-500 border-red-300 bg-red-50/70'
              : 'bg-gradient-to-br from-red-50/50 to-white hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-red-800">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>התראות בלות (פטור/ריק)</span>
            </span>
            <span className="font-mono text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-black">
              בקרת חיוב
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-red-700">
            {discrepancyOrders.length}
          </div>
          <p className="text-[11px] text-red-600/90 mt-1 font-medium">בלות ללא חיוב פיקדון או סף משטח</p>
        </div>

        <div
          onClick={() => setActiveFilter('all_deposits')}
          className={`p-4 win-card rounded-2xl cursor-pointer transition ${
            activeFilter === 'all_deposits'
              ? 'ring-2 ring-teal-500 border-teal-300 bg-teal-50/50'
              : 'bg-gradient-to-br from-teal-50/70 to-white hover:border-teal-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-teal-800">
            <span>בלות פקדון מחצבה</span>
            <span className="font-mono text-[10px] bg-teal-100 px-2 py-0.5 rounded">מק"ט 60002</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{totalBags}</div>
          <p className="text-[11px] text-slate-500 mt-1">חישוב יחס 1:1 על חול, סומסום, טיט, חצץ</p>
        </div>

        <div
          onClick={() => setActiveFilter('all_deposits')}
          className="p-4 win-card rounded-2xl bg-gradient-to-br from-blue-50/70 to-white"
        >
          <div className="flex items-center justify-between text-xs font-bold text-blue-800">
            <span>משטחי סבן עץ</span>
            <span className="font-mono text-[10px] bg-blue-100 px-2 py-0.5 rounded">מק"ט 60060</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{totalPallets}</div>
          <p className="text-[11px] text-slate-500 mt-1">חישוב תקן: 1 לכל 40 שקי מלט/טיט/דבק</p>
        </div>

        <div
          onClick={() => setActiveFilter('exempts')}
          className={`p-4 win-card rounded-2xl cursor-pointer transition ${
            activeFilter === 'exempts'
              ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/50'
              : 'bg-gradient-to-br from-emerald-50/70 to-white hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>פטורי פקדון</span>
            <span className="font-mono text-[10px] bg-emerald-100 px-2 py-0.5 rounded">הובלה ללא פריקה</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{exemptOrders.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">מק"טים 818050..818118 או מוצרי גבס בלבד</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="win-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <span>
              {activeFilter === 'discrepancies'
                ? 'תעודות חריגות: בלות שסומנו כפטור או ריק'
                : activeFilter === 'exempts'
                ? 'תעודות בפטור מפיקדון'
                : 'תעודות בסידור עם חובת פקדון'}
            </span>
            <span className="text-slate-400 font-normal">({filtered.length} רשומות)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all_deposits')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeFilter === 'all_deposits'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              עם פיקדון ({depositOrders.length})
            </button>
            <button
              onClick={() => setActiveFilter('discrepancies')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                activeFilter === 'discrepancies'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>התראות בלות ({discrepancyOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('exempts')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeFilter === 'exempts'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              פטורים ({exemptOrders.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-3">מספר הזמנה</th>
                <th className="p-3">קבלן / לקוח</th>
                <th className="p-3">סבב ונהג</th>
                <th className="p-3">פירוט מוצרים בתעודה</th>
                <th className="p-3">פיקדונות שחויבו</th>
                <th className="p-3">סטטוס בקרה</th>
                <th className="p-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    לא נמצאו רשומות מתאימות לחיפוש או לסינון הנוכחי.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const alertInfo = checkBelaDepositAlert(o);

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-slate-50/80 transition ${
                        alertInfo.hasAlert ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-blue-700">#{o.orderNumber}</td>
                      <td className="p-3 font-bold text-slate-800">{o.clientName}</td>
                      <td className="p-3 text-slate-600">
                        <div>{o.roundAndTime}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{o.driver}</div>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-700 font-medium" title={o.productsSummary}>
                        {o.productsSummary}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {alertInfo.hasAlert && (
                            <span
                              className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] shadow-2xs inline-flex items-center gap-1 animate-pulse"
                              title={alertInfo.reason}
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-white" />
                              <span>חסר פיקדון בלות!</span>
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                              alertInfo.hasAlert
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : o.depositsSummary === 'פטור'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-teal-50 text-teal-800 border border-teal-200'
                            }`}
                          >
                            {o.depositsSummary || 'ריק'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        {alertInfo.hasAlert ? (
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-300 font-bold text-[11px] inline-flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3 text-red-600" />
                            <span>בדיקת חיוב / סף משטח</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                            תואם קומקס
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {alertInfo.hasAlert ? (
                          <button
                            onClick={() =>
                              alert(
                                `הזמנה #${o.orderNumber} עבור ${o.clientName}:\n` +
                                `פירוט: ${o.productsSummary}\n` +
                                `פיקדונות נוכחיים: ${o.depositsSummary || 'ריק'}\n\n` +
                                `המלצת מערכת: יש לחייב מק"ט 60002 עבור שקי הבלה, או לאמת אישור פטור / סף מינימום משטח מול מנהל המכירות.`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-2xs transition"
                          >
                            פרטי חריגה
                          </button>
                        ) : (
                          <button
                            onClick={() => alert(`רישום זיכוי/החזרת פקדון עבור הזמנה #${o.orderNumber}`)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                          >
                            רשום החזרה
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
