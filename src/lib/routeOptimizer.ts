/**
 * routeOptimizer.ts
 * מנוע אופטימיזציית מסלולי חלוקה מרובי-תחנות (Bulk Route Optimization)
 * וייצור קישורים משולבים ל-Waze ו-Google Maps, כולל מחולל לינקים מקוצרים.
 * עבור ח. סבן חומרי בניין (1994) בע"מ
 */

import { Order, OrderStatus } from '../types';

export interface RouteStop {
  orderId: string;
  orderNumber: string;
  clientName: string;
  clientPhone?: string;
  destinationAddress: string;
  city: string;
  roundAndTime: string;
  productsSummary: string;
  depositsSummary: string;
  warehouse: string;
  wazeUrl: string;
  status: OrderStatus;
  notes?: string;
  lat: number;
  lng: number;
  completed?: boolean;
}

export interface BulkRouteData {
  id: string;
  code: string; // קוד מקוצר ייחודי (6 תווים)
  driver: string;
  date: string;
  originWarehouse: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  stops: RouteStop[];
  totalStops: number;
  combinedWazeUrl: string;
  googleMapsMultiStopUrl: string;
  shortUrl: string;
  createdAt: string;
}

// קואורדינטות מחסני ח. סבן כפר סבא
export const WAREHOUSE_COORDINATES: Record<string, { name: string; address: string; lat: number; lng: number }> = {
  haresh: {
    name: 'מחסן 4 — החרש (מלט, בלות וחומרי מליטה)',
    address: 'החרש 8, כפר סבא',
    lat: 32.1724,
    lng: 34.9248,
  },
  talmid: {
    name: 'מחסן 1 — התלמיד (גבס, בידוד ופרופילים)',
    address: 'התלמיד 3, כפר סבא',
    lat: 32.1782,
    lng: 34.9151,
  },
};

// מיפוי קואורדינטות משוער ליישובי השרון והמרכז (לחישוב מרחקים גיאוגרפי)
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'כפר סבא': { lat: 32.175, lng: 34.906 },
  'הוד השרון': { lat: 32.158, lng: 34.888 },
  'רעננה': { lat: 32.184, lng: 34.870 },
  'הרצליה': { lat: 32.166, lng: 34.843 },
  'רמת השרון': { lat: 32.143, lng: 34.841 },
  'טירה': { lat: 32.233, lng: 34.950 },
  'טייבה': { lat: 32.266, lng: 35.011 },
  'קלנסווה': { lat: 32.285, lng: 34.982 },
  'פתח תקווה': { lat: 32.087, lng: 34.887 },
  'תל אביב': { lat: 32.085, lng: 34.781 },
  'רמת גן': { lat: 32.068, lng: 34.824 },
  'בני ברק': { lat: 32.084, lng: 34.835 },
  'נתניה': { lat: 32.321, lng: 34.853 },
  'קדימה': { lat: 32.277, lng: 34.912 },
  'צורן': { lat: 32.277, lng: 34.912 },
  'אבן יהודה': { lat: 32.270, lng: 34.888 },
  'תל מונד': { lat: 32.253, lng: 34.918 },
  'ראש העין': { lat: 32.095, lng: 34.957 },
};

/**
 * חילוץ עיר מתוך כתובת
 */
export function extractCityFromAddress(address: string, fallbackCity?: string): string {
  if (fallbackCity && fallbackCity.trim()) return fallbackCity.trim();

  for (const city of Object.keys(CITY_COORDINATES)) {
    if (address.includes(city)) return city;
  }

  // בדיקת פסיקים
  const parts = address.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }

  return 'כפר סבא';
}

/**
 * מציאת קואורדינטות לפי כתובת ועיר
 */
export function getCoordinatesForAddress(address: string, city?: string): { lat: number; lng: number } {
  const foundCity = extractCityFromAddress(address, city);
  const baseCoord = CITY_COORDINATES[foundCity] || CITY_COORDINATES['כפר סבא'];

  // תוספת דיטר קטן (jitter) מבוסס מחרוזת הכתובת כדי שלכל יעד יהיה מיקום ייחודי בחישוב
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }
  const jitterLat = ((hash % 100) / 100) * 0.008;
  const jitterLng = (((hash >> 3) % 100) / 100) * 0.008;

  return {
    lat: baseCoord.lat + jitterLat,
    lng: baseCoord.lng + jitterLng,
  };
}

/**
 * חישוב מרחק אווירי בק"מ (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // רדיוס כדור הארץ בק"מ
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * המרת הזמנות לתחנות מסלול (RouteStops)
 */
export function ordersToRouteStops(orders: Order[]): RouteStop[] {
  return orders.map((o) => {
    const city = extractCityFromAddress(o.destinationAddress, o.city);
    const coords = getCoordinatesForAddress(o.destinationAddress, city);

    return {
      orderId: o.id,
      orderNumber: o.orderNumber,
      clientName: o.clientName,
      clientPhone: o.clientPhone || '',
      destinationAddress: o.destinationAddress,
      city,
      roundAndTime: o.roundAndTime,
      productsSummary: o.productsSummary,
      depositsSummary: o.depositsSummary,
      warehouse: o.warehouse,
      wazeUrl: o.wazeUrl || `https://www.waze.com/ul?q=${encodeURIComponent(o.destinationAddress)}&navigate=yes`,
      status: o.status,
      notes: o.notes,
      lat: coords.lat,
      lng: coords.lng,
      completed: o.status === 'נמסר באתר',
    };
  });
}

/**
 * אופטימיזציית מסלול רב-תחנות (Nearest Neighbor Heuristic)
 * מתחיל ממחסן המוצא, בוחר בכל פעם את התחנה הקרובה ביותר שטרם נפקדה.
 * כמו כן מתחשב בסבבי זמן (סבב 1 עדיף על סבב 2 אם מוגדר)
 */
export function optimizeRouteStops(
  stops: RouteStop[],
  origin: { lat: number; lng: number }
): RouteStop[] {
  if (stops.length <= 1) return [...stops];

  const unvisited = [...stops];
  const optimized: RouteStop[] = [];

  let currentLat = origin.lat;
  let currentLng = origin.lng;

  // שלב 1: מיון מקדים לפי מספר סבב (למשל סבב 1 קודם לסבב 2)
  // במידה ויש סבבים מוגדרים
  const roundMap: Record<string, number> = {
    'סבב 1': 1,
    'סבב 2': 2,
    'סבב 3': 3,
    'סבב 4': 4,
  };

  const getRoundPriority = (roundAndTime: string): number => {
    for (const [key, val] of Object.entries(roundMap)) {
      if (roundAndTime.includes(key)) return val;
    }
    return 99; // ללא סבב מוגדר
  };

  while (unvisited.length > 0) {
    // בדיקת סבב מינימלי בקרב התחנות שטרם נפקדו
    const minRound = Math.min(...unvisited.map((s) => getRoundPriority(s.roundAndTime)));

    // מועמדים בסבב הנוכחי (או כולם אם אין סבבים מוגדרים)
    const candidates =
      minRound < 99
        ? unvisited.filter((s) => getRoundPriority(s.roundAndTime) === minRound)
        : unvisited;

    // מציאת התחנה הקרובה ביותר למיקום הנוכחי
    let bestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const stop = candidates[i];
      const dist = calculateDistanceKm(currentLat, currentLng, stop.lat, stop.lng);
      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = unvisited.findIndex((s) => s.orderId === stop.orderId);
      }
    }

    // הוספת התחנה הנבחרת
    const nextStop = unvisited.splice(bestIndex, 1)[0];
    optimized.push(nextStop);
    currentLat = nextStop.lat;
    currentLng = nextStop.lng;
  }

  return optimized;
}

/**
 * יצירת קישור Google Maps Multi-Stop רב-יעדים מלא
 * (נתמך באופן מובנה ומושלם בכל סמארטפון/דפדפן)
 */
export function generateGoogleMapsMultiStopUrl(
  originAddress: string,
  stops: RouteStop[]
): string {
  if (stops.length === 0) return '';

  const encodedOrigin = encodeURIComponent(originAddress);
  const destination = encodeURIComponent(stops[stops.length - 1].destinationAddress);

  if (stops.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${destination}&travelmode=driving`;
  }

  // תחנות ביניים (Waypoints)
  const intermediateWaypoints = stops
    .slice(0, -1)
    .map((s) => encodeURIComponent(s.destinationAddress))
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${destination}&waypoints=${intermediateWaypoints}&travelmode=driving`;
}

/**
 * יצירת לינק Waze משולב:
 * בוויז הניווט מתבצע ישירות לתחנה הראשונה עם יעד מוגדר.
 * בנוסף המערכת מספקת את לינק ה-Route Companion לנהג.
 */
export function generateCombinedWazeUrl(firstStop: RouteStop): string {
  if (!firstStop) return '';
  return `https://www.waze.com/ul?q=${encodeURIComponent(firstStop.destinationAddress)}&navigate=yes`;
}

/**
 * הפקת קוד מקוצר אקראי (6 תווים)
 */
export function generateShortCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * שמירת מסלול בשרת ו/או ב-LocalStorage והפקת לינק מקוצר
 */
export async function saveBulkRoute(routeData: Omit<BulkRouteData, 'shortUrl'>): Promise<BulkRouteData> {
  const code = routeData.code || generateShortCode();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const localShortUrl = `${origin}/?route=${code}`;

  const fullRoute: BulkRouteData = {
    ...routeData,
    code,
    shortUrl: localShortUrl,
  };

  // 1. שמירה מקומית ב-LocalStorage לגיבוי מיידי ולעבודה אופליין
  try {
    const existingRoutes = JSON.parse(localStorage.getItem('saban_saved_routes') || '{}');
    existingRoutes[code] = fullRoute;
    localStorage.setItem('saban_saved_routes', JSON.stringify(existingRoutes));
  } catch (e) {
    console.warn('LocalStorage route save failed:', e);
  }

  // 2. שמירה בשרת המערכת (Backend API)
  try {
    const res = await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullRoute),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.shortUrl) {
        fullRoute.shortUrl = data.shortUrl;
      }
    }
  } catch (err) {
    console.warn('Server route save error, fallback to local URL:', err);
  }

  // 3. קיצור באמצעות שירות TinyURL ציבורי לשידור קומפקטי בוואטסאפ (אם זמין)
  try {
    const tinyUrlApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullRoute.shortUrl)}`;
    const tinyRes = await Promise.race([
      fetch(tinyUrlApi),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1800)),
    ]);
    if (tinyRes.ok) {
      const shortened = await tinyRes.text();
      if (shortened && shortened.startsWith('http')) {
        fullRoute.shortUrl = shortened.trim();
      }
    }
  } catch {
    // השתמש ב-shortUrl המקומי הנקי
  }

  return fullRoute;
}

/**
 * טעינת מסלול לפי קוד מקוצר
 */
export async function getBulkRouteByCode(code: string): Promise<BulkRouteData | null> {
  // 1. נסה ב-LocalStorage
  try {
    const existingRoutes = JSON.parse(localStorage.getItem('saban_saved_routes') || '{}');
    if (existingRoutes[code]) {
      return existingRoutes[code];
    }
  } catch {}

  // 2. נסה מהשרת
  try {
    const res = await fetch(`/api/routes/${code}`);
    if (res.ok) {
      const data = await res.json();
      return data.route || null;
    }
  } catch (e) {
    console.warn('Error fetching route from server:', e);
  }

  return null;
}

/**
 * הפקת הודעת וואטסאפ מעוצבת ומוכנה לשידור לנהג (חכמת / עלי)
 */
export function generateDriverWhatsAppBroadcast(route: BulkRouteData): string {
  const driverName = route.driver.includes('חכמת') ? 'חכמת' : route.driver.includes('עלי') ? 'עלי' : route.driver;
  const truckIcon = route.driver.includes('חכמת') ? '🏗️' : '🚛';

  let msg = `🚚 *ח. סבן חומרי בניין — מסלול נסיעה מרוכז*\n`;
  msg += `👤 *שלום ${driverName}* ${truckIcon}\n`;
  msg += `📅 תאריך אספקה: ${route.date}\n`;
  msg += `🏢 מוצא: ${route.originWarehouse.name}\n`;
  msg += `📦 סה"כ תחנות פריקה: ${route.stops.length}\n\n`;

  msg += `🔗 *לינק מקוצר למסלול ניווט אינטראקטיבי (Waze לכל תחנה):*\n`;
  msg += `${route.shortUrl}\n\n`;

  msg += `🗺️ *מפות גוגל (כל התחנות ברצף אופטימלי):*\n`;
  msg += `${route.googleMapsMultiStopUrl}\n\n`;

  msg += `📍 *פירוט התחנות לפי סדר הנסיעה:*\n`;
  route.stops.forEach((stop, index) => {
    const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index] || `${index + 1}.`;
    msg += `${numEmoji} *הזמנה #${stop.orderNumber}* | ${stop.clientName}\n`;
    msg += `   📍 כתובת: ${stop.destinationAddress} (${stop.city})\n`;
    msg += `   📦 לפריקה: ${stop.productsSummary}\n`;
    msg += `   🛡️ פקדונות: ${stop.depositsSummary}\n`;
    msg += `   🧭 ניווט ישיר בוויז:\n   ${stop.wazeUrl}\n\n`;
  });

  msg += `נועה AI מאחלת לך נסיעה בטוחה ויום עבודה מוצלח! 🌹`;

  return msg;
}
