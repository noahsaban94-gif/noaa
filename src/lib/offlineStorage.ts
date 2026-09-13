/**
 * offlineStorage.ts
 * מנהל אחסון אופליין היברידי (IndexedDB + LocalStorage) לשמירת הזמנות
 * ח. סבן חומרי בניין (1994) בע"מ
 */

import { Order } from '../types';
import { INITIAL_ORDERS } from '../data/mockAndInitialData';

const STORAGE_KEY = 'noa_saban_orders_cache_v3';
const OLD_STORAGE_KEY = 'noa_saban_orders_cache_v2';
const DB_NAME = 'NoaSabanLogisticsDB';
const STORE_NAME = 'orders';

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function clearCachedOrders(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OLD_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear LocalStorage', e);
  }

  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
    } catch (e) {
      console.warn('Failed to clear IndexedDB', e);
    }
  }
}

export async function loadCachedOrders(): Promise<Order[]> {
  // Clean up legacy v1 key if present
  try {
    if (localStorage.getItem(OLD_STORAGE_KEY)) {
      localStorage.removeItem(OLD_STORAGE_KEY);
    }
  } catch {
    // ignore
  }

  const db = await openDB();
  if (db) {
    try {
      const orders = await new Promise<Order[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as Order[]);
        req.onerror = () => resolve([]);
      });

      if (orders && Array.isArray(orders)) {
        return orders;
      }
    } catch (e) {
      console.warn('IndexedDB read error, falling back to LocalStorage', e);
    }
  }

  // Fallback to LocalStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('LocalStorage error', e);
  }

  return INITIAL_ORDERS;
}

export async function saveCachedOrders(orders: Order[]): Promise<void> {
  // Always update LocalStorage for synchronous quick reads
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to save to LocalStorage', e);
  }

  // Save to IndexedDB
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      orders.forEach((ord) => store.put(ord));
    } catch (e) {
      console.warn('IndexedDB write error', e);
    }
  }
}
