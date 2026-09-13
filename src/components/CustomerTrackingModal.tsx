import React from 'react';
import { X } from 'lucide-react';
import { Order } from '../types';
import { CustomerTrackingView } from './CustomerTrackingView';

interface CustomerTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  allOrders?: Order[];
  onSelectOrder?: (order: Order) => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
}

export const CustomerTrackingModal: React.FC<CustomerTrackingModalProps> = ({
  isOpen,
  onClose,
  order,
  allOrders,
  onSelectOrder,
  onUpdateOrder,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-right animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 relative">
        {/* Modal Close Header */}
        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-white z-40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-400">תצוגה מקדימה של דף מעקב ללקוח</span>
            <span className="text-[11px] text-slate-400">#{order.orderNumber}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="סגור תצוגה מקדימה"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Customer Tracking View */}
        <div className="flex-1 overflow-y-auto">
          <CustomerTrackingView
            order={order}
            allOrders={allOrders}
            onSelectOrder={onSelectOrder}
            onBack={onClose}
            onUpdateOrder={onUpdateOrder}
          />
        </div>
      </div>
    </div>
  );
};
