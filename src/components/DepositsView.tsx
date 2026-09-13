import React, { useState } from 'react';
import {
  Package,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Search,
  Plus
} from 'lucide-react';
import { Order } from '../types';

interface DepositsViewProps {
  orders: Order[];
}

export const DepositsView: React.FC<DepositsViewProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract orders with active deposits
  const depositOrders = orders.filter((o) => {
    return o.depositsSummary && o.depositsSummary !== 'פטור';
  });

  const filtered = depositOrders.filter((o) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.clientName.toLowerCase().includes(q) ||
      o.orderNumber.includes(q) ||
      o.depositsSummary.toLowerCase().includes(q)
    );
  });

  // Calculate overall totals
  let totalBags = 0;
  let totalPallets = 0;
  depositOrders.forEach((o) => {
    const bagMatch = o.depositsSummary.match(/(\d+)\s*בלות/);
    if (bagMatch) totalBags += parseInt(bagMatch[1], 10);

    const palletMatch = o.depositsSummary.match(/(\d+)\s*משטחי סבן/);
    if (palletMatch) totalPallets += parseInt(palletMatch[1], 10);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 win-card rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">ניהול פקדונות וסגירת מעגל</h2>
            <p className="text-xs text-slate-500 font-medium">
              בקרת בלות (מק"ט 60002) ומשטחי סבן (מק"ט 60060) מול תעודות קומקס
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
            placeholder="חיפוש קבלן, הזמנה או פקדון..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 win-card rounded-2xl bg-gradient-to-br from-teal-50/70 to-white">
          <div className="flex items-center justify-between text-xs font-bold text-teal-800">
            <span>בלות פקדון מחצבה</span>
            <span className="font-mono text-[10px] bg-teal-100 px-2 py-0.5 rounded">מק"ט 60002</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{totalBags}</div>
          <p className="text-[11px] text-slate-500 mt-1">חישוב יחס 1:1 על חול, סומסום, טיט, חצץ</p>
        </div>

        <div className="p-4 win-card rounded-2xl bg-gradient-to-br from-blue-50/70 to-white">
          <div className="flex items-center justify-between text-xs font-bold text-blue-800">
            <span>משטחי סבן עץ</span>
            <span className="font-mono text-[10px] bg-blue-100 px-2 py-0.5 rounded">מק"ט 60060</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{totalPallets}</div>
          <p className="text-[11px] text-slate-500 mt-1">חישוב תקן: 1 לכל 40 שקי מלט/טיט/דבק</p>
        </div>

        <div className="p-4 win-card rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>פטורי פקדון</span>
            <span className="font-mono text-[10px] bg-emerald-100 px-2 py-0.5 rounded">הובלה ללא פריקה</span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {orders.filter((o) => o.depositsSummary === 'פטור').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">מק"טים 818050..818118 או מוצרי גבס בלבד</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="win-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>תעודות בסידור עם חובת פקדון</span>
          <span className="text-slate-400 font-normal">{filtered.length} רשומות</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-3">מספר הזמנה</th>
                <th className="p-3">קבלן / לקוח</th>
                <th className="p-3">סבב</th>
                <th className="p-3">נהג</th>
                <th className="p-3">פירוט פקדונות שחויבו</th>
                <th className="p-3">סטטוס תעודה</th>
                <th className="p-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-blue-700">#{o.orderNumber}</td>
                  <td className="p-3 font-bold text-slate-800">{o.clientName}</td>
                  <td className="p-3 text-slate-600">{o.roundAndTime}</td>
                  <td className="p-3 text-slate-700 font-medium">{o.driver}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                      {o.depositsSummary}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                      תואם קומקס
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => alert(`רישום זיכוי/החזרת פקדון עבור הזמנה #${o.orderNumber}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                    >
                      רשום החזרה
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
