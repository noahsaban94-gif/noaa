import React from 'react';
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
  Navigation
} from 'lucide-react';
import { Order, Driver, ActiveTab } from '../types';
import { MetricsGrid } from './MetricsGrid';
import { OrderCard } from './OrderCard';
import { TopProductsChart } from './TopProductsChart';
import { WeeklyOrdersAnalyticsChart } from './WeeklyOrdersAnalyticsChart';
import { NOA_AVATAR_IMAGE } from '../data/mockAndInitialData';

interface DashboardViewProps {
  orders: Order[];
  drivers: Driver[];
  setActiveTab: (tab: ActiveTab) => void;
  onUpdateStatus: (id: string, newStatus: any) => void;
  onDeleteOrder: (id: string) => void;
  onOpenNewOrder: () => void;
  onOpenMorningReport: () => void;
  onFilterByDriver?: (driverName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  drivers,
  setActiveTab,
  onUpdateStatus,
  onDeleteOrder,
  onOpenNewOrder,
  onOpenMorningReport,
}) => {
  // Urgent or active orders
  const activeOrders = orders.slice(0, 4);

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
                בוקר טוב, ראמי וצוות ח. סבן! 🌹
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              נועה AI מחוברת ל-Google Sheets (טאב: דוח_בוקר_מבצעי). הנה כרטיסי ההזמנה המבצעיים להיום.
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

      {/* Active Orders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900">הזמנות בסבב נוכחי</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {activeOrders.length} בטיפול
            </span>
          </div>

          <button
            onClick={() => setActiveTab('schedule')}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
          >
            <span>לכל סידור העבודה ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="p-8 win-card rounded-2xl text-center space-y-2.5 border border-slate-200/80">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">סידור העבודה ריק כרגע</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              אין כרגע הזמנות פעילות בסידור. ניתן להזין הזמנה חדשה או לבצע סנכרון מול טאב "דוח_בוקר_מבצעי" בגיליון ח. סבן.
            </p>
            <div className="pt-1">
              <button
                onClick={onOpenNewOrder}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>הזמנה חדשה לסידור</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={onUpdateStatus}
                onDeleteOrder={onDeleteOrder}
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
