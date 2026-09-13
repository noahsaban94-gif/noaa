import React from 'react';
import {
  Clock,
  Truck,
  AlertTriangle,
  PackageCheck,
  CheckCircle2,
  Navigation,
  Sparkles,
  Phone
} from 'lucide-react';
import { Order, Driver } from '../types';

interface MetricsGridProps {
  orders: Order[];
  drivers: Driver[];
  onFilterByStatus?: (status: string) => void;
  onFilterByDriver?: (driverName: string) => void;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  orders,
  drivers,
  onFilterByStatus,
  onFilterByDriver,
}) => {
  // Compute metrics
  const inProgressOrders = orders.filter((o) => o.status !== 'נמסר באתר');
  const deliveredOrders = orders.filter((o) => o.status === 'נמסר באתר');
  const readyOrders = orders.filter((o) => o.status === 'מוכן להעמסה');
  const onRoadOrders = orders.filter((o) => o.status === 'בדרך ללקוח');
  const alertOrders = orders.filter((o) => o.status === 'חריגה / עיכוב');

  // Compute total deposits
  let totalBigBags = 0;
  let totalWoodPallets = 0;

  orders.forEach((o) => {
    if (o.depositsSummary && o.depositsSummary !== 'פטור') {
      const belaMatch = o.depositsSummary.match(/(\d+)\s*בלות/);
      if (belaMatch) totalBigBags += parseInt(belaMatch[1], 10);

      const palletMatch = o.depositsSummary.match(/(\d+)\s*משטחי סבן/);
      if (palletMatch) totalWoodPallets += parseInt(palletMatch[1], 10);
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Orders in Progress */}
      <div className="win-card win-card-hover rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-slate-500">הזמנות בביצוע</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{inProgressOrders.length}</span>
            <span className="text-xs text-slate-400 font-medium">מתוך {orders.length} היום</span>
          </div>
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-semibold">
              {readyOrders.length} מוכנות
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
              {onRoadOrders.length} בדרך
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
              {deliveredOrders.length} סופקו
            </span>
          </div>
        </div>
      </div>

      {/* 2. Drivers Status */}
      <div className="win-card win-card-hover rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-slate-500">סטטוס נהגים וצי רכב</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-2">
          {drivers.map((d) => {
            const driverOrdersCount = orders.filter((o) => o.driver.includes(d.name.split(' ')[0])).length;
            return (
              <div
                key={d.id}
                onClick={() => onFilterByDriver && onFilterByDriver(d.name.split(' ')[0])}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${d.status === 'on_road' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="font-bold text-slate-800">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600">
                    {driverOrdersCount} הזמנות
                  </span>
                  <a
                    href={`tel:${d.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-slate-400 hover:text-blue-600"
                    title={`חייג ל${d.name}`}
                  >
                    <Phone className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Alerts & Delays */}
      <div className="win-card win-card-hover rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-slate-500">התראות וחריגות מבצעיות</span>
          <div className={`w-8 h-8 rounded-xl ${alertOrders.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center`}>
            {alertOrders.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${alertOrders.length > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {alertOrders.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {alertOrders.length > 0 ? 'חריגות הדורשות התערבות' : 'הסידור זורם ללא עיכובים'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">בקרת הנפת מנוף:</span>
            <span className="text-emerald-700 font-bold">תקינה (100%)</span>
          </div>
        </div>
      </div>

      {/* 4. Active Deposits Tracking */}
      <div className="win-card win-card-hover rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-slate-500">פקדונות פעילים היום</span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{totalBigBags}</span>
              <span className="text-[11px] text-slate-500 mr-1">בלות</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{totalWoodPallets}</span>
              <span className="text-[11px] text-slate-500 mr-1">משטחי סבן</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">מק"ט בלה: 60002</span>
            <span className="text-blue-700 font-bold">משטח: 60060</span>
          </div>
        </div>
      </div>
    </div>
  );
};
