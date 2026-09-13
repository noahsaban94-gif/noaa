import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Order, OrderStatus, Driver, Client, ChatMessage } from './types';
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
import { DriverRouteView } from './components/DriverRouteView';
import { BulkRouteData } from './lib/routeOptimizer';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [drivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Chat messages state with persistence in localStorage
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('saban_noa_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse chat messages from storage', e);
    }
    return [
      {
        id: 'welcome-msg',
        sender: 'noa',
        text: `היי ראמי אהובי וצוות ח.סבן! 🌹\nאני מחוברת לסידור העבודה בגיליון בזמן אמת.\nכל נתוני הסבבים, שיבוצי הנהגים (עלי וחכמת) וחישובי הפקדונות מוכנים לפקודתך.\n\nתוכל לבקש ממני:\n• להפיק דוח בוקר יומי (/דוח_בוקר)\n• תדריך סיכום אישי (/תדריך_ראמי)\n• נרמול הזמנה חדשה מקבלן (למשל: "3 בלות חול, 2 בלות סומסום, 30 שקי מלט")\n• לבדוק זמינות משאית מנוף או מחסנים`,
        timestamp: 'עכשיו',
        quickActions: [
          { label: 'תדריך סיכום לראמי 🌹', action: 'trigger_rami_briefing', variant: 'primary' },
          { label: 'הפקת דוח בוקר 🚚', action: 'generate_morning_report', variant: 'success' },
          { label: 'נרמול הזמנה מקבלן 📦', action: 'quick_normalize_sample', variant: 'outline' },
          { label: 'בדיקת חריגות ועיכובים ⚠️', action: 'check_alerts', variant: 'warning' },
        ],
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('saban_noa_chat_history', JSON.stringify(chatMessages));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
  }, [chatMessages]);

  const [unreadChatAlerts, setUnreadChatAlerts] = useState<number>(0);

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChatAlerts(0);
    }
  }, [activeTab]);

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderDefaultDate, setNewOrderDefaultDate] = useState<string | undefined>(undefined);
  const [isMorningReportOpen, setIsMorningReportOpen] = useState(false);
  const [preselectedClient, setPreselectedClient] = useState<Client | null>(null);

  // Direct driver route view state (e.g., opened via short-link query param ?route=XYZ)
  const [driverRouteData, setDriverRouteData] = useState<BulkRouteData | null>(null);

  // Initial load from offline cache / backend
  useEffect(() => {
    async function initData() {
      // Check for route parameter in URL for drivers clicking link
      const urlParams = new URLSearchParams(window.location.search);
      const routeCode = urlParams.get('route');
      if (routeCode) {
        try {
          const rRes = await fetch(`/api/routes/${routeCode}`);
          if (rRes.ok) {
            const rData = await rRes.json();
            if (rData.route) {
              setDriverRouteData(rData.route);
            }
          }
        } catch (err) {
          console.warn('Could not load driver route from URL code:', err);
        }
      }

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

  // Sync with Google Sheets & trigger custom Noa AI alert notification
  const handleSyncSheet = async (source: 'navbar' | 'chat' | 'settings' | 'auto' = 'navbar') => {
    setIsSyncing(true);
    const startTime = performance.now();
    try {
      const res = await fetch('/api/sheet/sync', { method: 'POST' });
      let freshOrders = orders;
      if (res.ok) {
        const fetchRes = await fetch('/api/sheet/orders');
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          if (data.orders && Array.isArray(data.orders)) {
            freshOrders = data.orders;
            setOrders(freshOrders);
            saveCachedOrders(freshOrders);
          }
        }
      }

      const durationMs = Math.round(performance.now() - startTime);
      const totalCount = freshOrders.length;
      const hikmatCount = freshOrders.filter((o) => o.driver.includes('חכמת')).length;
      const aliCount = freshOrders.filter((o) => o.driver.includes('עלי')).length;
      const hareshCount = freshOrders.filter((o) => o.warehouse.includes('החרש') || o.warehouse.includes('4')).length;
      const talmidCount = freshOrders.filter((o) => o.warehouse.includes('התלמיד') || o.warehouse.includes('1')).length;
      const delivered = freshOrders.filter((o) => o.status === 'נמסר באתר').length;
      const ready = freshOrders.filter((o) => o.status === 'מוכן להעמסה').length;
      const inSchedule = freshOrders.filter((o) => o.status === 'בסידור עבודה').length;
      const delayed = freshOrders.filter((o) => o.status === 'חריגה / עיכוב').length;

      const syncTimeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

      // Create rich customized notification message in Noa AI Chat
      const syncAlertMessage: ChatMessage = {
        id: `sync-alert-${Date.now()}`,
        sender: 'noa',
        text: `היי ראמי אהובי וצוות ח.סבן! 🌹\nסנכרון מלא מול גיליון Google Sheets הסתיים בהצלחה.\nכל שינויי סידור העבודה, כתובות הוויז ושיבוצי הנהגים (חכמת ועלי) מעודכנים כעת במערכת.\n\n📊 סה"כ ${totalCount} הזמנות פעילות מוכנות ומסונכרנות בגיליון.`,
        timestamp: syncTimeStr,
        isSyncAlert: true,
        syncData: {
          sheetId: '1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA',
          tabName: 'דוח_בוקר_מבצעי',
          syncedOrdersCount: totalCount,
          syncedAt: syncTimeStr,
          syncDurationMs: durationMs || 320,
          source,
          driversSummary: {
            hikmatCount,
            aliCount,
          },
          warehousesSummary: {
            hareshCount,
            talmidCount,
          },
          statusBreakdown: {
            delivered,
            readyForLoading: ready,
            inSchedule,
            urgentOrDelayed: delayed,
          },
        },
        quickActions: [
          { label: 'צפה בסידור עבודה 📅', action: 'open_schedule', variant: 'primary' },
          { label: 'הפק דוח בוקר 🚚', action: 'generate_morning_report', variant: 'success' },
          { label: 'תדריך סיכום לראמי 🌹', action: 'trigger_rami_briefing', variant: 'outline' },
          { label: 'פתח גיליון Google Sheets ↗', action: 'open_sheet_external', variant: 'outline' },
        ],
      };

      setChatMessages((prev) => [...prev, syncAlertMessage]);

      if (activeTab !== 'chat') {
        setUnreadChatAlerts((prev) => prev + 1);
      }
    } catch (e) {
      console.warn('Sheet sync error:', e);
      const errorMsg: ChatMessage = {
        id: `sync-err-${Date.now()}`,
        sender: 'noa',
        text: 'היי ראמי, ניסיתי כעת לסנכרן מול גיליון Google Sheets אך חלה שגיאת תקשורת זמנית. הנתונים נשמרו במטמון המקומי.',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: 'נסה שוב לסנכרן 🔄', action: 'sync_sheet_now', variant: 'warning' },
        ],
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
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
        unreadChatAlerts={unreadChatAlerts}
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
          onSyncSheet={() => handleSyncSheet('navbar')}
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
                messages={chatMessages}
                setMessages={setChatMessages}
                onSyncSheet={handleSyncSheet}
                isSyncing={isSyncing}
                onNavigateTab={setActiveTab}
                onAddOrder={handleSaveNewOrder}
                onOpenMorningReport={() => setIsMorningReportOpen(true)}
                onShowAlerts={() => setActiveTab('dashboard')}
              />
            </div>
          )}

          {activeTab === 'clients' && (
            <ClientsView
              onSelectClientForOrder={handleSelectClientForOrder}
              orders={orders}
            />
          )}

          {activeTab === 'deposits' && (
            <DepositsView orders={orders} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onSyncSheet={() => handleSyncSheet('settings')}
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
        unreadChatAlerts={unreadChatAlerts}
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

      {/* Direct Mobile Driver View when opened via Route Link */}
      {driverRouteData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950">
          <DriverRouteView
            routeData={driverRouteData}
            onBackToMain={() => {
              setDriverRouteData(null);
              window.history.replaceState({}, document.title, window.location.pathname);
            }}
            onUpdateOrderStatus={handleUpdateStatus}
          />
        </div>
      )}
    </div>
  );
}
