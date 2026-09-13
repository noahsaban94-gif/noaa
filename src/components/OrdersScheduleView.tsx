import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Route,
  FileSpreadsheet,
  Plus,
  Truck,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { CalendarView } from './CalendarView';
import { CalendarScheduleView } from './CalendarScheduleView';
import { BulkRouteModal } from './BulkRouteModal';
import { DriverRouteView } from './DriverRouteView';
import { BulkRouteData } from '../lib/routeOptimizer';

interface OrdersScheduleViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  onEditOrder?: (order: Order) => void;
  onOpenNewOrder: (defaultDate?: string) => void;
  onOpenMorningReport: () => void;
  searchQuery: string;
}

export const OrdersScheduleView: React.FC<OrdersScheduleViewProps> = ({
  orders,
  onUpdateStatus,
  onDeleteOrder,
  onEditOrder,
  onOpenNewOrder,
  onOpenMorningReport,
  searchQuery,
}) => {
  // Top-level schedule view mode: 'calendar' (default, requested Calendar View) or 'advanced_schedule'
  const [scheduleMode, setScheduleMode] = useState<'calendar' | 'advanced_schedule'>('calendar');

  // Bulk route state
  const [isBulkRouteModalOpen, setIsBulkRouteModalOpen] = useState(false);
  const [bulkModalDriver, setBulkModalDriver] = useState<string>('חכמת (מרצדס מנוף)');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [activeDriverRoute, setActiveDriverRoute] = useState<BulkRouteData | null>(null);

  // Selection handlers
  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllForDriver = (driverName: string) => {
    const ids = orders
      .filter((o) => o.driver.includes(driverName))
      .map((o) => o.id);
    setSelectedOrderIds((prev) => {
      const set = new Set([...prev, ...ids]);
      return Array.from(set);
    });
    setBulkModalDriver(driverName === 'חכמת' ? 'חכמת (מרצדס מנוף)' : 'עלי (משאית איסוזו)');
  };

  const handleClearSelection = () => {
    setSelectedOrderIds([]);
  };

  const handleOpenBulkNavigate = (driverName?: string) => {
    if (driverName) {
      setBulkModalDriver(driverName);
    } else {
      const firstSelected = orders.find((o) => selectedOrderIds.includes(o.id));
      if (firstSelected) {
        setBulkModalDriver(firstSelected.driver);
      }
    }
    setIsBulkRouteModalOpen(true);
  };

  // If driver route view is active
  if (activeDriverRoute) {
    return (
      <DriverRouteView
        routeData={activeDriverRoute}
        onBackToMain={() => setActiveDriverRoute(null)}
        onUpdateOrderStatus={onUpdateStatus}
      />
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Header Card */}
      <div className="win-card rounded-3xl p-5 bg-gradient-to-l from-blue-50/70 via-white to-sky-50/40 border border-blue-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                לוח שנה וסידור עבודה מבצעי
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Google Sheets Live
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              לחץ על כל תאריך בלוח השנה כדי לראות את כרטיסי ההזמנה, עומסי האספקה וחלוקת הנהגים לאותו יום
            </p>
          </div>
        </div>

        {/* Mode Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main View Switcher */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex items-center">
            <button
              type="button"
              onClick={() => setScheduleMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                scheduleMode === 'calendar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>לוח שנה (Calendar View) 📅</span>
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode('advanced_schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                scheduleMode === 'advanced_schedule'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>סידור עבודה מרוכז ({orders.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenBulkNavigate()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200 transition active:scale-95 shadow-xs"
            title="איחוד הזמנות לנהג, אופטימיזציית מסלול רב-תחנות והפקת לינק מקוצר ל-Waze"
          >
            <Route className="w-4 h-4 text-sky-600" />
            <span>ניווט מרוכז 🗺️</span>
          </button>

          <button
            type="button"
            onClick={onOpenMorningReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition active:scale-95 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>דוח בוקר 🚚</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenNewOrder()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף הזמנה</span>
          </button>
        </div>
      </div>

      {/* Primary Display: Calendar View or Advanced Schedule View */}
      {scheduleMode === 'calendar' ? (
        <CalendarView
          orders={orders}
          onUpdateStatus={onUpdateStatus}
          onDeleteOrder={onDeleteOrder}
          onEditOrder={onEditOrder}
          onOpenNewOrder={onOpenNewOrder}
          onOpenMorningReport={onOpenMorningReport}
          searchQuery={searchQuery}
          selectedOrderIds={selectedOrderIds}
          onToggleSelectOrder={handleToggleSelectOrder}
          onSelectAllForDriver={handleSelectAllForDriver}
          onClearSelection={handleClearSelection}
          onOpenBulkNavigate={handleOpenBulkNavigate}
        />
      ) : (
        <CalendarScheduleView
          orders={orders}
          onUpdateStatus={onUpdateStatus}
          onDeleteOrder={onDeleteOrder}
          onEditOrder={onEditOrder}
          onOpenNewOrder={onOpenNewOrder}
          onOpenMorningReport={onOpenMorningReport}
          searchQuery={searchQuery}
        />
      )}

      {/* Bulk Navigation Modal */}
      <BulkRouteModal
        isOpen={isBulkRouteModalOpen}
        onClose={() => setIsBulkRouteModalOpen(false)}
        selectedOrders={orders.filter((o) => selectedOrderIds.includes(o.id))}
        allDayOrders={orders}
        currentDate="2026-09-13"
        defaultDriver={bulkModalDriver}
        onRouteCreated={(routeData) => {
          setActiveDriverRoute(routeData);
          setIsBulkRouteModalOpen(false);
        }}
      />
    </div>
  );
};
