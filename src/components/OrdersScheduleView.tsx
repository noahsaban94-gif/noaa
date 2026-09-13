import React, { useState } from 'react';
import {
  Filter,
  Plus,
  Truck,
  Building2,
  Calendar,
  FileSpreadsheet,
  Layers,
  LayoutGrid,
  List
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { OrderCard } from './OrderCard';

interface OrdersScheduleViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  onEditOrder?: (order: Order) => void;
  onOpenNewOrder: () => void;
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
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.destinationAddress.toLowerCase().includes(q) ||
        o.driver.toLowerCase().includes(q) ||
        o.productsSummary.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Driver filter
    if (driverFilter !== 'all') {
      if (!o.driver.includes(driverFilter)) return false;
    }

    // Warehouse filter
    if (warehouseFilter !== 'all') {
      if (!o.warehouse.includes(warehouseFilter)) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (o.status !== statusFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 win-card rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">סידור עבודה יומי</h2>
            <p className="text-xs text-slate-500 font-medium">
              מחובר ל-Google Sheet (סה"כ {filteredOrders.length} הזמנות מוצגות)
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMorningReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>הפקת דוח בוקר 🚚</span>
          </button>

          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף הזמנה לסידור</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 win-card rounded-2xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-slate-400 font-bold ml-1">
            <Filter className="w-3.5 h-3.5" />
            <span>סינון:</span>
          </span>

          {/* Driver filter */}
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">כל הנהגים</option>
            <option value="חכמת">חכמת (מרצדס מנוף)</option>
            <option value="עלי">עלי (משאית איסוזו)</option>
          </select>

          {/* Warehouse filter */}
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">כל המחסנים</option>
            <option value="החרש">מחסן 4 - החרש (מלט/בלות)</option>
            <option value="התלמיד">מחסן 1 - התלמיד (גבס/בידוד)</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="בסידור עבודה">בסידור עבודה</option>
            <option value="מוכן להעמסה">מוכן להעמסה</option>
            <option value="בטעינה במחסן">בטעינה במחסן</option>
            <option value="בדרך ללקוח">בדרך ללקוח</option>
            <option value="נמסר באתר">סופק בהצלחה</option>
            <option value="חריגה / עיכוב">חריגה / עיכוב</option>
          </select>
        </div>

        {/* Clear filters if active */}
        {(driverFilter !== 'all' || warehouseFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setDriverFilter('all');
              setWarehouseFilter('all');
              setStatusFilter('all');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
          >
            איפוס סינון
          </button>
        )}
      </div>

      {/* Orders Grid / List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 win-card rounded-2xl text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">לא נמצאו הזמנות התואמות את הסינון</p>
          <p className="text-xs text-slate-500">נסה לשנות את תנאי הסינון או הוסף הזמנה חדשה</p>
          <button
            onClick={onOpenNewOrder}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>הזמנה חדשה</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={onUpdateStatus}
              onDeleteOrder={onDeleteOrder}
              onEditOrder={onEditOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};
