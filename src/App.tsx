import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Order, OrderStatus, Driver, Client } from './types';
import { INITIAL_DRIVERS, INITIAL_ORDERS } from './data/mockAndInitialData';
import { loadCachedOrders, saveCachedOrders, clearCachedOrders } from './lib/offlineStorage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { DashboardView } from './components/DashboardView';
import { OrdersScheduleView } from './components/OrdersScheduleView';
import { NoaChat } from './components/NoaChat';
import { ClientsView } from './components/ClientsView';
import { DepositsView } from './components/DepositsView';
import { SettingsView } from './components/SettingsView';
import { NewOrderModal } from './components/NewOrderModal';
import { MorningReportModal } from './components/MorningReportModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { NotificationToast } from './components/NotificationToast';
import { triggerReadyForLoadingNotification } from './lib/notificationService';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [drivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderDefaultDate, setNewOrderDefaultDate] = useState<string | undefined>(undefined);
  const [isMorningReportOpen, setIsMorningReportOpen] = useState(false);
  const [preselectedClient, setPreselectedClient] = useState<Client | null>(null);

  // Initial load from offline cache / backend
  useEffect(() => {
    async function initData() {
      const cached = await loadCachedOrders();
      if (cached && Array.isArray(cached)) {
        setOrders(cached);
      }

      // Sync from backend
      try {
        const res = await fetch('/api/sheet/orders');
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            setOrders(data.orders);
            saveCachedOrders(data.orders);
          }
        }
      } catch (e) {
        console.warn('Initial fetch from backend failed, using cache:', e);
      }
    }
    initData();
  }, []);

  // Clear all cached / offline orders
  const handleClearOfflineOrders = useCallback(async () => {
    setOrders([]);
    await clearCachedOrders();
    try {
      await fetch('/api/sheet/orders', { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend clear orders failed, local storage cleared:', e);
    }
  }, []);

  // Update order status (with backend sync and offline persistence)
  const handleUpdateStatus = useCallback(async (id: string, newStatus: OrderStatus) => {
    let orderToNotify: Order | undefined;

    setOrders((prev) => {
      const existing = prev.find((o) => o.id === id);
      if (existing && existing.status !== newStatus && newStatus === 'מוכן להעמסה') {
        orderToNotify = { ...existing, status: newStatus };
      }

      const updated = prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o));
      saveCachedOrders(updated);
      return updated;
    });

    // Trigger local Browser Notification & Audio Chime if status changed to 'מוכן להעמסה'
    if (orderToNotify) {
      triggerReadyForLoadingNotification(orderToNotify);
    }

    try {
      await fetch(`/api/sheet/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn('Backend sync failed, saved in local cache:', e);
    }
  }, []);

  // Delete order
  const handleDeleteOrder = useCallback(async (id: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      saveCachedOrders(updated);
      return updated;
    });

    try {
      await fetch(`/api/sheet/orders/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend delete failed, updated local cache:', e);
    }
  }, []);

  // Save new order
  const handleSaveNewOrder = useCallback(async (newOrderData: Partial<Order>) => {
    try {
      const res = await fetch('/api/sheet/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders((prev) => {
            const updated = [data.order, ...prev];
            saveCachedOrders(updated);
            return updated;
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Backend create order failed, saving locally:', e);
    }

    // Fallback local save
    const fallbackOrder: Order = {
      id: `ord-${Date.now()}`,
      roundAndTime: newOrderData.roundAndTime || 'סבב 1 (07:30)',
      orderNumber: newOrderData.orderNumber || `${Math.floor(6215100 + Math.random() * 900)}`,
      clientName: newOrderData.clientName || 'לקוח חדש',
      clientPhone: newOrderData.clientPhone || '',
      warehouse: newOrderData.warehouse || '🏭 4️⃣ (החרש)',
      destinationAddress: newOrderData.destinationAddress || 'רעננה',
      city: newOrderData.city || 'רעננה',
      driver: newOrderData.driver || 'חכמת (מרצדס מנוף)',
      productsSummary: newOrderData.productsSummary || '',
      depositsSummary: newOrderData.depositsSummary || 'פטור',
      wazeUrl: newOrderData.wazeUrl || `https://www.waze.com/ul?q=${encodeURIComponent(newOrderData.destinationAddress || 'רעננה')}&navigate=yes`,
      status: 'בסידור עבודה',
      date: newOrderData.date || newOrderDefaultDate || '2026-09-13',
      createdAt: new Date().toISOString(),
      notes: newOrderData.notes || '',
    };

    setOrders((prev) => {
      const updated = [fallbackOrder, ...prev];
      saveCachedOrders(updated);
      return updated;
    });
  }, []);

  // Sync with Google Sheets
  const handleSyncSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sheet/sync', { method: 'POST' });
      if (res.ok) {
        const fetchRes = await fetch('/api/sheet/orders');
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          if (data.orders) {
            setOrders(data.orders);
            saveCachedOrders(data.orders);
          }
        }
      }
    } catch (e) {
      console.warn('Sheet sync error:', e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  // Preselect client from directory
  const handleSelectClientForOrder = (client: Client) => {
    setPreselectedClient(client);
    setIsNewOrderOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-slate-100/60 font-sans antialiased text-slate-900 overflow-hidden" dir="rtl">
      {/* Windows 11 Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ordersCount={orders.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Windows 11 Navbar */}
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNewOrder={() => {
            setPreselectedClient(null);
            setIsNewOrderOpen(true);
          }}
          onOpenMorningReport={() => setIsMorningReportOpen(true)}
          onSyncSheet={handleSyncSheet}
          isSyncing={isSyncing}
          onOpenChat={() => setActiveTab('chat')}
          onOpenSettings={() => setActiveTab('settings')}
          onSelectOrder={() => setActiveTab('schedule')}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              drivers={drivers}
              setActiveTab={setActiveTab}
              onUpdateStatus={handleUpdateStatus}
              onDeleteOrder={handleDeleteOrder}
              onOpenNewOrder={() => {
                setPreselectedClient(null);
                setIsNewOrderOpen(true);
              }}
              onOpenMorningReport={() => setIsMorningReportOpen(true)}
            />
          )}

          {activeTab === 'schedule' && (
            <OrdersScheduleView
              orders={orders}
              onUpdateStatus={handleUpdateStatus}
              onDeleteOrder={handleDeleteOrder}
              onOpenNewOrder={(date?: string) => {
                setPreselectedClient(null);
                setNewOrderDefaultDate(date);
                setIsNewOrderOpen(true);
              }}
              onOpenMorningReport={() => setIsMorningReportOpen(true)}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'chat' && (
            <div className="h-full">
              <NoaChat
                orders={orders}
                onAddOrder={handleSaveNewOrder}
                onOpenMorningReport={() => setIsMorningReportOpen(true)}
                onShowAlerts={() => setActiveTab('dashboard')}
              />
            </div>
          )}

          {activeTab === 'clients' && (
            <ClientsView onSelectClientForOrder={handleSelectClientForOrder} />
          )}

          {activeTab === 'deposits' && (
            <DepositsView orders={orders} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onSyncSheet={handleSyncSheet}
              isSyncing={isSyncing}
              ordersCount={orders.length}
              onClearOfflineOrders={handleClearOfflineOrders}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ordersCount={orders.length}
      />

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => {
          setIsNewOrderOpen(false);
          setPreselectedClient(null);
          setNewOrderDefaultDate(undefined);
        }}
        onSaveOrder={handleSaveNewOrder}
        preselectedClient={preselectedClient}
        initialDate={newOrderDefaultDate}
      />

      {/* Morning Report Operational Modal */}
      <MorningReportModal
        isOpen={isMorningReportOpen}
        onClose={() => setIsMorningReportOpen(false)}
        orders={orders}
      />

      {/* Real-time Order Ready Notification Toast */}
      <NotificationToast onSelectOrder={() => setActiveTab('schedule')} />

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
