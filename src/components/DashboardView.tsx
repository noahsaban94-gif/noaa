import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Truck,
  Building2,
  Package,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Send,
  Navigation,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Order, Driver, ActiveTab, OrderStatus } from '../types';
import { MetricsGrid } from './MetricsGrid';
import { OrderCard } from './OrderCard';
import { TopProductsChart } from './TopProductsChart';
import { WeeklyOrdersAnalyticsChart } from './WeeklyOrdersAnalyticsChart';
import { NOA_AVATAR_IMAGE } from '../data/mockAndInitialData';

interface DashboardViewProps {
  orders: Order[];
  drivers: Driver[];
  setActiveTab: (tab: ActiveTab) => void;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  onOpenNewOrder: () => void;
  onOpenMorningReport: () => void;
  onFilterByDriver?: (driverName: string) => void;
  onEditOrder?: (order: Order) => void;
  onOpenClientPortfolio?: (clientName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  drivers,
  setActiveTab,
  onUpdateStatus,
  onDeleteOrder,
  onOpenNewOrder,
  onOpenMorningReport,
  onEditOrder,
  onOpenClientPortfolio,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');

  // Filter orders for today or active orders
  const today = '2026-09-13';
  const todayOrders = orders.filter((o) => !o.date || o.date === today);
  const baseOrders = todayOrders.length > 0 ? todayOrders : orders;

  const filteredOrders = baseOrders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesDriver =
      driverFilter === 'all' ||
      (driverFilter === 'hikmat' && (o.driver.includes('חכמת') || o.driver.includes('מנוף'))) ||
      (driverFilter === 'ali' && o.driver.includes('עלי'));
    return matchesStatus && matchesDriver;
  });

  return (
    <div className="space-y-5">
      {/* Welcome Banner with Rami & Noa */}
      <div className="win-card rounded-3xl p-5 bg-gradient-to-l from-blue-50/90 via-sky-50/50 to-white border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <img
              src={NOA_AVATAR_IMAGE}
              alt="נועה AI"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-blue-500/30"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                סידור היום — בוקר טוב, ראמי וצוות ח. סבן! 🌹
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              כרטיסי הזמנה ושינוי סטטוסים בזמן אמת מול Google Sheets וסבבי החלוקה של חכמת ועלי.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-blue-700 text-xs font-bold shadow-2xs transition active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>שוחח עם נועה AI</span>
          </button>

          <button
            onClick={onOpenMorningReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm shadow-amber-500/20 transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>דוח בוקר לוואטסאפ</span>
          </button>
        </div>
      </div>

      {/* 4 Windows 11 Metrics Cards */}
      <MetricsGrid orders={orders} drivers={drivers} />

      {/* Top Products Frequency Analytics Chart (Recharts) */}
      <TopProductsChart orders={orders} />

      {/* Weekly Orders Analytics Chart (Recharts) */}
      <WeeklyOrdersAnalyticsChart orders={orders} />

      {/* Active Orders Section — סידור היום */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900">סידור היום — כרטיסי משימה וסטטוסים</h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {filteredOrders.length} הזמנות מוצגות
            </span>
            <span className="hidden md:inline text-[11px] text-slate-500 font-medium">
              (שינוי סטטוס ישיר בקליק מכל כרטיס)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('schedule')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-100 transition"
            >
              <span>לכל סידור העבודה ({orders.length})</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>

        {/* Quick Filter Bar: Statuses and Drivers */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/60 p-2 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 pl-1">סינון סטטוס:</span>
            {[
              { id: 'all', label: `הכל (${baseOrders.length})` },
              { id: 'בסידור עבודה', label: `בסידור (${baseOrders.filter((o) => o.status === 'בסידור עבודה').length})` },
              { id: 'מוכן להעמסה', label: `מוכן להעמסה (${baseOrders.filter((o) => o.status === 'מוכן להעמסה').length})` },
              { id: 'בטעינה במחסן', label: `בטעינה (${baseOrders.filter((o) => o.status === 'בטעינה במחסן').length})` },
              { id: 'בדרך ללקוח', label: `בדרך (${baseOrders.filter((o) => o.status === 'בדרך ללקוח').length})` },
              { id: 'נמסר באתר', label: `סופק (${baseOrders.filter((o) => o.status === 'נמסר באתר').length})` },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id)}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition text-xs cursor-pointer ${
                  statusFilter === chip.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400">נהג:</span>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">כל הנהגים</option>
              <option value="hikmat">חכמת (מרצדס מנוף)</option>
              <option value="ali">עלי (איסוזו)</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 win-card rounded-2xl text-center space-y-2.5 border border-slate-200/80">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">אין הזמנות התואמות לסינון הנבחר</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              ניתן לאפס את הסינון או להזין הזמנה חדשה לסידור היום.
            </p>
            <div className="pt-1 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setDriverFilter('all');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                הצג את כל ההזמנות
              </button>
              <button
                onClick={onOpenNewOrder}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>הזמנה חדשה</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={onUpdateStatus}
                onDeleteOrder={onDeleteOrder}
                onEditOrder={onEditOrder}
                onOpenClientPortfolio={onOpenClientPortfolio}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fleet & Warehouses Summary Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {/* Drivers Fleet Widget */}
        <div className="p-4.5 win-card rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900">משאיות וצוותי פריקה פעילים</h4>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">2 משאיות בשטח</span>
          </div>

          <div className="space-y-2.5">
            {drivers.map((drv) => (
              <div
                key={drv.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{drv.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                      {drv.truckNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    יעד נוכחי: {drv.currentLocation || 'בדרך ליעד'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${drv.phone}`}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 font-bold text-[11px] transition"
                  >
                    חייג
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warehouse Overview Widget */}
        <div className="p-4.5 win-card rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">סניפי ח. סבן — תכולת יציאה</h4>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold">2 מחסנים פתוחים</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="font-bold text-amber-900">🏭 מחסן 4 (החרש)</span>
              <p className="text-[11px] text-amber-700 mt-1">
                מלט, חול, סומסום, טיט, בלוקים ודבקים. העמסת מנוף.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100">
              <span className="font-bold text-sky-900">🏟️ מחסן 1 (התלמיד)</span>
              <p className="text-[11px] text-sky-700 mt-1">
                לוחות גבס לבן/ירוק/4K, פרופילים, בידוד ושפכטל.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
