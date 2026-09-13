import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Truck,
  Building2,
  Package,
  Layers,
  LayoutGrid,
  List,
  Filter,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { OrderCard } from './OrderCard';
import {
  extractOrderDate,
  formatHebrewFullDate,
  generateCalendarDays,
  getWorkloadInfo,
  HEBREW_MONTHS,
  HEBREW_DAYS_SHORT,
  CalendarDay,
  WorkloadInfo
} from '../lib/dateUtils';

interface CalendarScheduleViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  onEditOrder?: (order: Order) => void;
  onOpenNewOrder: (defaultDate?: string) => void;
  onOpenMorningReport: () => void;
  searchQuery: string;
}

export const CalendarScheduleView: React.FC<CalendarScheduleViewProps> = ({
  orders,
  onUpdateStatus,
  onDeleteOrder,
  onEditOrder,
  onOpenNewOrder,
  onOpenMorningReport,
  searchQuery,
}) => {
  // Calendar month state: Year 2026, Month 8 (September, 0-indexed)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-13'); // Today in system
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Filters
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dayDriverFilter, setDayDriverFilter] = useState<string>('all');

  // WhatsApp broadcast copy state
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);

  // Filter all orders based on query and global filters
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
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

      if (driverFilter !== 'all' && !o.driver.includes(driverFilter)) {
        return false;
      }

      if (warehouseFilter !== 'all' && !o.warehouse.includes(warehouseFilter)) {
        return false;
      }

      if (statusFilter !== 'all' && o.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, driverFilter, warehouseFilter, statusFilter]);

  // Group filtered orders by date (YYYY-MM-DD)
  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    filteredOrders.forEach((order) => {
      const d = extractOrderDate(order);
      if (!map[d]) map[d] = [];
      map[d].push(order);
    });
    return map;
  }, [filteredOrders]);

  // Calendar days grid
  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8); // September
    setSelectedDate('2026-09-13');
  };

  // Orders for the selected date
  const selectedDateOrders = useMemo(() => {
    const list = ordersByDate[selectedDate] || [];
    if (dayDriverFilter === 'all') return list;
    return list.filter((o) => o.driver.includes(dayDriverFilter));
  }, [ordersByDate, selectedDate, dayDriverFilter]);

  // Workload info for selected date
  const selectedDateWorkload: WorkloadInfo = getWorkloadInfo(
    (ordersByDate[selectedDate] || []).length
  );

  // Month operational summary
  const monthStats = useMemo(() => {
    let totalMonthOrders = 0;
    const activeDaysSet = new Set<string>();
    let totalDeposits = 0;

    Object.entries(ordersByDate).forEach(([d, list]: [string, Order[]]) => {
      const [y, m] = d.split('-').map(Number);
      if (y === currentYear && m - 1 === currentMonth) {
        totalMonthOrders += list.length;
        if (list.length > 0) activeDaysSet.add(d);
        list.forEach((o) => {
          const num = o.depositsSummary?.match(/(\d+)\s*(בלות|משטחים)/g);
          if (num) totalDeposits += num.length;
        });
      }
    });

    return {
      totalOrders: totalMonthOrders,
      activeDays: activeDaysSet.size,
      totalDeposits,
    };
  }, [ordersByDate, currentYear, currentMonth]);

  // Generate broadcast message for all orders on the selected date
  const handleCopyDayBroadcast = () => {
    const dayOrders = ordersByDate[selectedDate] || [];
    if (dayOrders.length === 0) return;

    let text = `🚚 *ח. סבן חומרי בניין — סידור עבודה יומי*\n`;
    text += `📅 *תאריך:* ${formatHebrewFullDate(selectedDate)}\n`;
    text += `סה"כ סבבים מתוכננים: ${dayOrders.length}\n`;
    text += `────────────────────\n\n`;

    dayOrders.forEach((o, i) => {
      text += `*סבב ${i + 1} (${o.roundAndTime}):*\n`;
      text += `📋 הזמנה: #${o.orderNumber}\n`;
      text += `👤 לקוח: ${o.clientName}\n`;
      text += `📍 יעד: ${o.destinationAddress}\n`;
      text += `🏭 מחסן: ${o.warehouse}\n`;
      text += `🚛 נהג: ${o.driver}\n`;
      text += `📦 מוצרים: ${o.productsSummary}\n`;
      text += `♻️ פקדונות: ${o.depositsSummary}\n`;
      text += `🧭 Waze: ${o.wazeUrl}\n\n`;
    });

    text += `נועה AI מאחלת נסיעה בטוחה ויום מוצלח! 🌹`;

    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Header Card */}
      <div className="win-card rounded-3xl p-5 bg-gradient-to-l from-blue-50/70 via-white to-sky-50/40 border border-blue-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                סידור עבודה ולוח שנה מבצעי
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Google Sheets Live
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              תצוגת עומסי אספקה יומית, סבבי מנוף ואיסוזו ושכבת כרטיסי עבודה נפתחת לפי תאריך
            </p>
          </div>
        </div>

        {/* Action Buttons & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View switcher: Calendar vs Full List */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex items-center">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'calendar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>לוח שנה 📅</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>רשימה מלאה ({filteredOrders.length})</span>
            </button>
          </div>

          <button
            onClick={onOpenMorningReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition active:scale-95 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>דוח בוקר 🚚</span>
          </button>

          <button
            onClick={() => onOpenNewOrder(selectedDate)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition active:scale-95"
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
            <span>סינון מהיר:</span>
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

          {(driverFilter !== 'all' || warehouseFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setDriverFilter('all');
                setWarehouseFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-1"
            >
              איפוס סינון
            </button>
          )}
        </div>

        {/* Month Summary Stats Badge */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>חודש {HEBREW_MONTHS[currentMonth]}:</span>
            <strong className="text-slate-800">{monthStats.totalOrders} הזמנות</strong>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <strong className="text-slate-800">{monthStats.activeDays}</strong>
            <span>ימי אספקה פעילים</span>
          </span>
        </div>
      </div>

      {/* CALENDAR VIEW MODE */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Grid Container */}
          <div className="win-card rounded-3xl p-5 border border-slate-200/90 shadow-sm">
            {/* Month Navigation & Legend Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-0.5">
                  <button
                    onClick={handlePrevMonth}
                    title="חודש קודם"
                    className="p-2 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="px-4 py-1 font-black text-slate-900 text-sm">
                    {HEBREW_MONTHS[currentMonth]} {currentYear}
                  </div>

                  <button
                    onClick={handleNextMonth}
                    title="חודש הבא"
                    className="p-2 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleGoToday}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition active:scale-95"
                >
                  היום (13/09)
                </button>
              </div>

              {/* Workload Legend (מקרא עומסים) */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600 bg-slate-50/80 px-3 py-1.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold">עומסי אספקה:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span>פנוי (0)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>קל (1-2)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>בינוני (3-4)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>כבד (5+)</span>
                </span>
              </div>
            </div>

            {/* Days of Week Header (Israeli week: ראשון..שבת) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-bold text-slate-500">
              {HEBREW_DAYS_SHORT.map((dayShort, idx) => (
                <div
                  key={idx}
                  className={`py-1.5 rounded-xl ${
                    idx === 5 || idx === 6 ? 'text-slate-400 bg-slate-50/50' : 'text-slate-700'
                  }`}
                >
                  {dayShort}
                </div>
              ))}
            </div>

            {/* Monthly Day Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((day: CalendarDay) => {
                const dayOrders = ordersByDate[day.dateString] || [];
                const count = dayOrders.length;
                const workload = getWorkloadInfo(count);
                const isSelected = selectedDate === day.dateString;
                const isWeekend = day.dayOfWeek === 5 || day.dayOfWeek === 6;

                return (
                  <div
                    key={day.dateString}
                    onClick={() => setSelectedDate(day.dateString)}
                    className={`relative min-h-[92px] sm:min-h-[105px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-right group ${
                      !day.isCurrentMonth
                        ? 'opacity-35 bg-slate-50/50 border-slate-100 hover:opacity-75'
                        : isWeekend
                        ? 'bg-slate-50/40 border-slate-200/70 hover:bg-slate-50'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    } ${
                      isSelected
                        ? 'ring-2 ring-blue-600 bg-blue-50/80 border-blue-400 shadow-md transform -translate-y-0.5'
                        : ''
                    }`}
                  >
                    {/* Top Row: Day Number + Today / Load Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-black transition ${
                          day.isToday
                            ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs'
                            : isSelected
                            ? 'text-blue-900 font-extrabold'
                            : 'text-slate-800'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {/* Today Badge / Workload Dot */}
                      <div className="flex items-center gap-1">
                        {day.isToday && (
                          <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md text-[9px] font-black bg-blue-100 text-blue-800">
                            היום
                          </span>
                        )}
                        {count > 0 && (
                          <span
                            className={`w-2 h-2 rounded-full ${workload.dotColor} ring-2 ring-white`}
                            title={`${workload.label} (${count} הזמנות)`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Middle: Order count pill & load bar */}
                    {count > 0 ? (
                      <div className="my-1 space-y-1">
                        <div
                          className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold flex items-center justify-between border ${workload.badgeBg} ${workload.badgeText} ${workload.borderColor}`}
                        >
                          <span>{count} הזמנות</span>
                          <span className="text-[9px] opacity-75 font-semibold">
                            {count >= 3 ? '🔥' : '🚚'}
                          </span>
                        </div>

                        {/* Truck / Driver mini indicators */}
                        <div className="hidden sm:flex items-center gap-1 text-[9px] text-slate-500 font-medium truncate">
                          {dayOrders.some((o) => o.driver.includes('חכמת')) && (
                            <span className="px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              חכמת 🏗️
                            </span>
                          )}
                          {dayOrders.some((o) => o.driver.includes('עלי')) && (
                            <span className="px-1 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200">
                              עלי 🚚
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="my-1 flex items-center justify-center text-[10px] text-slate-300 group-hover:text-blue-400 transition">
                        <span className="opacity-0 group-hover:opacity-100 font-bold">+ הוסף</span>
                      </div>
                    )}

                    {/* Bottom: Visual Load Level Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full ${workload.barColor} transition-all`}
                        style={{
                          width:
                            count === 0
                              ? '0%'
                              : count === 1
                              ? '25%'
                              : count === 2
                              ? '50%'
                              : count <= 4
                              ? '75%'
                              : '100%',
                        }}
                      />
                    </div>

                    {/* Selected Indicator Arrow pointing to the layer below */}
                    {isSelected && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rotate-45 z-10" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* LOWER LAYER — OPENS UNDERNEATH ACCORDING TO SELECTED DATE (שכבה מתחת לפי בחירה לפי תאריכים) */}
          <div className="win-card rounded-3xl p-5 sm:p-6 bg-white/95 border-2 border-blue-200/90 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-3 duration-300">
            {/* Layer Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      סידור עבודה: {formatHebrewFullDate(selectedDate)}
                    </h2>
                    {selectedDate === '2026-09-13' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
                        היום המבצעי הפעיל
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${selectedDateWorkload.badgeBg} ${selectedDateWorkload.badgeText} ${selectedDateWorkload.borderColor}`}
                    >
                      {selectedDateWorkload.label} • {selectedDateOrders.length} הזמנות
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span>{selectedDateWorkload.description}</span>
                  </p>
                </div>
              </div>

              {/* Day Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Driver filter within this date */}
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 text-xs font-bold">
                  <button
                    onClick={() => setDayDriverFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      dayDriverFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    כל הנהגים
                  </button>
                  <button
                    onClick={() => setDayDriverFilter('חכמת')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      dayDriverFilter === 'חכמת'
                        ? 'bg-amber-100 text-amber-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    חכמת (מנוף)
                  </button>
                  <button
                    onClick={() => setDayDriverFilter('עלי')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      dayDriverFilter === 'עלי'
                        ? 'bg-sky-100 text-sky-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    עלי (איסוזו)
                  </button>
                </div>

                {/* Broadcast entire day to WhatsApp */}
                <button
                  onClick={handleCopyDayBroadcast}
                  disabled={selectedDateOrders.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition active:scale-95"
                  title="העתק סידור יומי מלא מוכן לשידור לקבוצת הנהגים"
                >
                  {copiedBroadcast ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>הועתק ללוח! ✅</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>שידור לנהגים 📲</span>
                    </>
                  )}
                </button>

                {/* Add order to this date */}
                <button
                  onClick={() => onOpenNewOrder(selectedDate)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>הוסף הזמנה לתאריך זה</span>
                </button>
              </div>
            </div>

            {/* Orders Cards Grid for Selected Date */}
            {selectedDateOrders.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    אין הזמנות משובצות לתאריך {formatHebrewFullDate(selectedDate)}
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    המשאיות וצוות המנוף פנויים. לחץ על הכפתור מטה כדי לשבץ סבב אספקה חדש לתאריך זה.
                  </p>
                </div>
                <button
                  onClick={() => onOpenNewOrder(selectedDate)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ שריין הזמנה ל{formatHebrewFullDate(selectedDate).split(',')[0]}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDateOrders.map((order) => (
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
        </div>
      )}

      {/* FULL LIST VIEW MODE (FALLBACK / ALTERNATIVE) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-extrabold text-slate-800">
              כלל ההזמנות בסידור העבודה ({filteredOrders.length})
            </h3>
            <button
              onClick={() => setViewMode('calendar')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              חזרה לתצוגת לוח שנה 📅
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 win-card rounded-2xl text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">לא נמצאו הזמנות התואמות את הסינון</p>
              <p className="text-xs text-slate-500">נסה לשנות את תנאי הסינון או הוסף הזמנה חדשה</p>
              <button
                onClick={() => onOpenNewOrder(selectedDate)}
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
      )}
    </div>
  );
};
