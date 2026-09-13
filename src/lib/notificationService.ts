/**
 * notificationService.ts
 * מערכת התראות מקומית (Browser Notifications & Web Audio Chime)
 * עבור מנהלים לוגיסטיים ונהגי חלוקה בח. סבן חומרי בניין (1994) בע"מ
 */

import { Order } from '../types';

export interface LocalNotificationItem {
  id: string;
  orderId: string;
  orderNumber: string;
  clientName: string;
  driver: string;
  warehouse: string;
  destinationAddress: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'ready_for_loading' | 'system_test';
}

const SETTINGS_KEY = 'saban_notification_settings';
const HISTORY_KEY = 'saban_notification_history';

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  targetRole: 'all' | 'manager' | 'driver';
  driverFilter: string; // e.g. 'all' or driver name
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  targetRole: 'all',
  driverFilter: 'all',
};

// ==========================================
// Settings & History Storage
// ==========================================

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function getNotificationHistory(): LocalNotificationItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveNotificationToHistory(item: LocalNotificationItem): void {
  try {
    const current = getNotificationHistory();
    // Keep last 30 notifications
    const updated = [item, ...current.slice(0, 29)];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save notification history:', e);
  }
}

export function markNotificationAsRead(id: string): void {
  try {
    const current = getNotificationHistory();
    const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to mark notification as read:', e);
  }
}

export function clearNotificationHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.warn('Failed to clear notification history:', e);
  }
}

// ==========================================
// Browser Notification API Helpers
// ==========================================

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('Error requesting Notification permission:', e);
    return Notification.permission;
  }
}

// ==========================================
// Web Audio Chime Synthesizer (Native Zero-Dep)
// ==========================================

export function playNotificationChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Dual-tone logistics chime (F5 -> A5)
    const now = ctx.currentTime;

    // Tone 1: 698.46 Hz (F5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 880 Hz (A5) slightly delayed for a bright dispatch chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);

    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
  }
}

// ==========================================
// Main Dispatch Function: Order Ready for Loading
// ==========================================

export async function triggerReadyForLoadingNotification(order: Order): Promise<LocalNotificationItem> {
  const settings = getNotificationSettings();

  const title = `🚚 הזמנה #${order.orderNumber} מוכנה להעמסה!`;
  const body = `לקוח: ${order.clientName} | יעד: ${order.destinationAddress}\nנהג: ${order.driver} | ${order.warehouse}`;

  const notificationItem: LocalNotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    clientName: order.clientName,
    driver: order.driver,
    warehouse: order.warehouse,
    destinationAddress: order.destinationAddress,
    title,
    body,
    timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    read: false,
    type: 'ready_for_loading',
  };

  // 1. Save to local notification history
  saveNotificationToHistory(notificationItem);

  // 2. Play sound chime if enabled
  if (settings.soundEnabled) {
    playNotificationChime();
  }

  // 3. Dispatch in-app event so Toast and Bell UI update immediately
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('saban_ready_notification', {
      detail: { notification: notificationItem, order },
    });
    window.dispatchEvent(event);
  }

  // 4. Trigger Native Browser Notification if supported and permitted
  if (isBrowserNotificationSupported() && Notification.permission === 'granted') {
    try {
      const browserNotif = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `ready-order-${order.id}`,
        dir: 'rtl',
        lang: 'he',
        requireInteraction: false,
      });

      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
      };
    } catch (e) {
      console.warn('Native Browser Notification failed (iframe sandboxing or policy):', e);
    }
  }

  return notificationItem;
}

// ==========================================
// Test Notification Generator
// ==========================================

export async function sendTestNotification(): Promise<LocalNotificationItem> {
  const settings = getNotificationSettings();

  const title = `🔔 בדיקת התראת דפדפן — ח. סבן לוגיסטיקה`;
  const body = `התראה זו מדמה עדכון סטטוס ל'מוכן להעמסה' עבור מנהל לוגיסטי ונהגי החלוקה.`;

  const testItem: LocalNotificationItem = {
    id: `test-${Date.now()}`,
    orderId: 'test-sample',
    orderNumber: '6215199',
    clientName: 'בדיקת מערכת — גבס שרון',
    driver: 'חכמת (מרצדס מנוף)',
    warehouse: '🏭 4️⃣ (החרש)',
    destinationAddress: 'אחוזה 120, רעננה',
    title,
    body,
    timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    read: false,
    type: 'system_test',
  };

  saveNotificationToHistory(testItem);

  if (settings.soundEnabled) {
    playNotificationChime();
  }

  if (typeof window !== 'undefined') {
    const event = new CustomEvent('saban_ready_notification', {
      detail: {
        notification: testItem,
        order: {
          id: 'test-sample',
          orderNumber: '6215199',
          clientName: 'בדיקת מערכת — גבס שרון',
          driver: 'חכמת (מרצדס מנוף)',
          warehouse: '🏭 4️⃣ (החרש)',
          destinationAddress: 'אחוזה 120, רעננה',
          roundAndTime: 'סבב 1 (07:30)',
          productsSummary: '3 בלות חול ים, 2 בלות סומסום, 20 שקי מלט נשר',
          depositsSummary: '5 בלות',
          wazeUrl: 'https://www.waze.com/ul?q=רעננה&navigate=yes',
          status: 'מוכן להעמסה',
          createdAt: new Date().toISOString(),
        } as Order,
      },
    });
    window.dispatchEvent(event);
  }

  if (isBrowserNotificationSupported() && Notification.permission === 'granted') {
    try {
      const browserNotif = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag: `test-${Date.now()}`,
        dir: 'rtl',
        lang: 'he',
      });
      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
      };
    } catch (e) {
      console.warn('Native test notification failed:', e);
    }
  }

  return testItem;
}
