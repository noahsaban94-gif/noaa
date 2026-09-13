/**
 * dateUtils.ts
 * כלי עזר לתאריכים, לוח שנה וחישוב עומסי הזמנות בסידור העבודה
 * ח. סבן חומרי בניין (1994) בע"מ
 */

import { Order } from '../types';

export const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

export const HEBREW_DAYS_FULL = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'יום שבת',
];

export const HEBREW_DAYS_SHORT = [
  'א׳',
  'ב׳',
  'ג׳',
  'ד׳',
  'ה׳',
  'ו׳',
  'ש׳',
];

/**
 * חילוץ תאריך YYYY-MM-DD מהזמנה בצורה אמינה
 */
export function extractOrderDate(order: Order): string {
  if (order.date && /^\d{4}-\d{2}-\d{2}$/.test(order.date)) {
    return order.date;
  }

  if (order.createdAt) {
    // פורמט ISO או YYYY-MM-DD
    const isoMatch = order.createdAt.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // פורמט ישראלי DD/MM/YYYY
    const slashMatch = order.createdAt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const day = slashMatch[1].padStart(2, '0');
      const month = slashMatch[2].padStart(2, '0');
      const year = slashMatch[3];
      return `${year}-${month}-${day}`;
    }
  }

  // ברירת מחדל: היום המבצעי הפעיל במערכת
  return '2026-09-13';
}

/**
 * המרת תאריך לפורמט עברי מלא (למשל: יום ראשון, 13 בספטמבר 2026)
 */
export function formatHebrewFullDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayName = HEBREW_DAYS_FULL[date.getDay()] || '';
    const monthName = HEBREW_MONTHS[m - 1] || '';
    return `${dayName}, ${d} ב${monthName} ${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * רמת עומס הזמנות לתאריך
 */
export type WorkloadLevel = 'empty' | 'low' | 'medium' | 'high';

export interface WorkloadInfo {
  level: WorkloadLevel;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotColor: string;
  barColor: string;
  description: string;
}

export function getWorkloadInfo(ordersCount: number): WorkloadInfo {
  if (ordersCount === 0) {
    return {
      level: 'empty',
      label: 'פנוי',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-500',
      borderColor: 'border-slate-200',
      dotColor: 'bg-slate-300',
      barColor: 'bg-slate-200',
      description: 'אין סבבים משובצים — המשאית והצוות פנויים',
    };
  }
  if (ordersCount <= 2) {
    return {
      level: 'low',
      label: 'עומס קל',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      dotColor: 'bg-emerald-500',
      barColor: 'bg-emerald-500',
      description: `${ordersCount} סבבים — עומס שגרתי ומאוזן`,
    };
  }
  if (ordersCount <= 4) {
    return {
      level: 'medium',
      label: 'עומס בינוני',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      borderColor: 'border-amber-200',
      dotColor: 'bg-amber-500',
      barColor: 'bg-amber-500',
      description: `${ordersCount} סבבים — עבודה צפופה, נדרש תזמון מנוף מדויק`,
    };
  }
  return {
    level: 'high',
    label: 'עומס כבד',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-300',
    dotColor: 'bg-rose-600',
    barColor: 'bg-rose-600',
    description: `${ordersCount} סבבים — תפוסה מלאה! מומלץ לוודא חלוקה בין חכמת ועלי`,
  };
}

/**
 * יצירת רשימת ימים לתצוגת חודש
 */
export interface CalendarDay {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number; // 0=Sunday..6=Saturday
}

export function generateCalendarDays(year: number, monthIndex: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  
  // תאריך היום במערכת
  const todayStr = '2026-09-13';

  // יום ראשון של החודש (0=Sun)
  const firstDay = new Date(year, monthIndex, 1);
  const startDayOfWeek = firstDay.getDay();

  // מספר ימים בחודש הנוכחי
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // ימים מהחודש הקודם כדי למלא את תחילת השורה
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateString: dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      dayOfWeek: (startDayOfWeek - 1 - i) % 7,
    });
  }

  // ימי החודש הנוכחי
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, monthIndex, d);
    days.push({
      dateString: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      dayOfWeek: dateObj.getDay(),
    });
  }

  // ימים מהחודש הבא כדי להשלים כפולות של 7 (עד 35 או 42 ימים)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(nextYear, nextMonth, d);
    days.push({
      dateString: dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      dayOfWeek: dateObj.getDay(),
    });
  }

  return days;
}
