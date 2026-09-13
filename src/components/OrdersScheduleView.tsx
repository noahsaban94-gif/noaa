import React from 'react';
import { Order, OrderStatus } from '../types';
import { CalendarScheduleView } from './CalendarScheduleView';

interface OrdersScheduleViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  onEditOrder?: (order: Order) => void;
  onOpenNewOrder: (defaultDate?: string) => void;
  onOpenMorningReport: () => void;
  searchQuery: string;
}

export const OrdersScheduleView: React.FC<OrdersScheduleViewProps> = (props) => {
  return <CalendarScheduleView {...props} />;
};
