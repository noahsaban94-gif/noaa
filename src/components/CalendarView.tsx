import React, { useState, useMemo, useRef } from 'react';
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
  ExternalLink,
  Route,
  Navigation,
  CheckSquare,
  Square,
  Smartphone,
  Eye,
  ArrowDown,
  CalendarDays,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { OrderCard } from './OrderCard';
import {
  extractOrderDate,
  formatHebrewFullDate,
  formatHebrewShortDate,
  generateCalendarDays,
  generateWeekDays,
  getWorkloadInfo,
  HEBREW_MONTHS,
  HEBREW_DAYS_SHORT,
  HEBREW_DAYS_FULL,
  CalendarDay,
  WorkloadInfo,
} from '../lib/dateUtils';

export interface CalendarViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (id: string) => void;
  onEditOrder?: (order: Order) => void;
  onOpenNewOrder: (defaultDate?: string) => void;
  onOpenMorningReport?: () => void;
  searchQuery?: string;
  selectedOrderIds?: string[];
  onToggleSelectOrder?: (id: string) => void;
  onSelectAllForDriver?: (driverName: string) => void;
  onClearSelection?: () => void;
  onOpenBulkNavigate?: (driver?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  orders,
  onUpdateStatus,
  onDeleteOrder,
  onEditOrder,
  onOpenNewOrder,
  onOpenMorningReport,
  searchQuery = '',
  selectedOrderIds = [],
  onToggleSelectOrder,
  onSelectAllForDriver,
  onClearSelection,
  onOpenBulkNavigate,
}) => {
  // Calendar date state: default to 2026-09-13 (today in system)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-13');
  const [calendarSubMode, setCalendarSubMode] = useState<'month' | 'week'>('month');

  // In-day filters
  const [dayDriverFilter, setDayDriverFilter] = useState<string>('all');
  const [copiedDayBroadcast, setCopiedDayBroadcast] = useState(false);

  // Ref to smoothly scroll to day orders section on click
  const dayOrdersSectionRef = useRef<HTMLDivElement>(null);

  // Filter orders by global search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.destinationAddress.toLowerCase().includes(q) ||
        o.driver.toLowerCase().includes(q) ||
        o.productsSummary.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

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

  // Calendar days grid for the selected month
  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Week days for the selected date
  const weekDays = useMemo(() => {
    return generateWeekDays(selectedDate);
  }, [selectedDate]);

  // Distinct dates in the current month that have orders (for quick date jumper pills)
  const activeMonthDates = useMemo(() => {
    return Object.keys(ordersByDate)
      .filter((dateStr) => {
        const [y, m] = dateStr.split('-').map(Number);
        return y === currentYear && m - 1 === currentMonth;
      })
      .sort();
  }, [ordersByDate, currentYear, currentMonth]);

  // Month navigation handlers
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
    handleSelectDate('2026-09-13');
  };

  // Day selection with smooth scroll feedback
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const [y, m] = dateStr.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);

    // Scroll to the day's orders section smoothly
    setTimeout(() => {
      if (dayOrdersSectionRef.current) {
        dayOrdersSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, 50);
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

  // Statistics for selected date
  const selectedDayStats = useMemo(() => {
    const list = ordersByDate[selectedDate] || [];
    const hikmatCount = list.filter((o) => o.driver.includes('חכמת')).length;
    const aliCount = list.filter((o) => o.driver.includes('עלי')).length;
    const warehouse4Count = list.filter(
      (o) => o.warehouse.includes('4') || o.warehouse.includes('החרש')
    ).length;
    const warehouse1Count = list.filter(
      (o) => o.warehouse.includes('1') || o.warehouse.includes('התלמיד')
    ).length;

    let depositsCount = 0;
    list.forEach((o) => {
      if (o.depositsSummary && !o.depositsSummary.includes('ללא')) {
        const matches = o.depositsSummary.match(/\d+/g);
        if (matches) {
          depositsCount += matches.map(Number).reduce((a, b) => a + b, 0);
        } else {
          depositsCount += 1;
        }
      }
    });

    return {
      total: list.length,
      hikmat: hikmatCount,
      ali: aliCount,
      warehouse4: warehouse4Count,
      warehouse1: warehouse1Count,
      deposits: depositsCount,
    };
  }, [ordersByDate, selectedDate]);

  // Copy structured day schedule to clipboard for WhatsApp
  const handleCopyDayBroadcast = () => {
    const list = ordersByDate[selectedDate] || [];
    if (list.length === 0) return;

    let text = `🚛 *סידור עבודה יומי ח. סבן חומרי בניין (1994) בע"מ*\n`;
    text += `📅 *${formatHebrewFullDate(selectedDate)}*\n`;
    text += `📊 סה"כ ${list.length} משימות אספקה משובצות\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Hikmat
    const hikmatOrders = list.filter((o) => o.driver.includes('חכמת'));
    if (hikmatOrders.length > 0) {
      text += `🏗️ *חכמת — משאית מרצדס מנוף (${hikmatOrders.length} סבבים):*\n`;
      hikmatOrders.forEach((o, i) => {
        text += `${i + 1}. *${o.roundAndTime}* | ${o.clientName}\n`;
        text += `   📍 יעד: ${o.destinationAddress}\n`;
        text += `   📦 מוצרים: ${o.productsSummary}\n`;
        if (o.depositsSummary && !o.depositsSummary.includes('ללא')) {
          text += `   ♻️ פקדונות: ${o.depositsSummary}\n`;
        }
        text += `   🚗 Waze: ${o.wazeUrl}\n\n`;
      });
    }

    // Ali
    const aliOrders = list.filter((o) => o.driver.includes('עלי'));
    if (aliOrders.length > 0) {
      text += `🚚 *עלי — משאית איסוזו (${aliOrders.length} סבבים):*\n`;
      aliOrders.forEach((o, i) => {
        text += `${i + 1}. *${o.roundAndTime}* | ${o.clientName}\n`;
        text += `   📍 יעד: ${o.destinationAddress}\n`;
        text += `   📦 מוצרים: ${o.productsSummary}\n`;
        if (o.depositsSummary && !o.depositsSummary.includes('ללא')) {
          text += `   ♻️ פקדונות: ${o.depositsSummary}\n`;
        }
        text += `   🚗 Waze: ${o.wazeUrl}\n\n`;
      });
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `נסיעה בטוחה ושמרו על הכללים! צוות לוגיסטיקה ח. סבן`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedDayBroadcast(true);
      setTimeout(() => setCopiedDayBroadcast(false), 2500);
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Interactive Calendar Card */}
      <div className="win-card rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm bg-white space-y-4">
        {/* Top Bar: Month Navigator, Mode Selector & Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="חודש קודם"
                className="p-2 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="px-4 py-1 font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span>
                  {HEBREW_MONTHS[currentMonth]} {currentYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                title="חודש הבא"
                className="p-2 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoToday}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition active:scale-95 flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>היום (13/09)</span>
            </button>
          </div>

          {/* Sub-view switcher: Month Grid vs Week Columns */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex items-center">
              <button
                type="button"
                onClick={() => setCalendarSubMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  calendarSubMode === 'month'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>חודש מלא 🗓️</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarSubMode('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  calendarSubMode === 'week'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>תצוגת שבוע 📅</span>
              </button>
            </div>

            {/* Workload Legend */}
            <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 bg-slate-50/80 px-3 py-1.5 rounded-2xl border border-slate-200/70">
              <span className="text-slate-400 font-bold">עומסים:</span>
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
        </div>

        {/* Quick Active Dates Jumper Strip */}
        {activeMonthDates.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 text-xs scrollbar-thin">
            <span className="text-slate-400 font-bold flex-shrink-0 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>ימים פעילים בחודש:</span>
            </span>

            {activeMonthDates.map((dStr) => {
              const count = (ordersByDate[dStr] || []).length;
              const isSelected = selectedDate === dStr;
              const isToday = dStr === '2026-09-13';
              const formattedShort = formatHebrewShortDate(dStr);

              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => handleSelectDate(dStr)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1.5 border active:scale-95 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{formattedShort}</span>
                  {isToday && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      היום
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* MONTH VIEW MODE */}
        {calendarSubMode === 'month' && (
          <div className="space-y-2">
            {/* Days of Week Header (Israeli week: ראשון עד שבת) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold text-slate-500">
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
                    onClick={() => handleSelectDate(day.dateString)}
                    className={`relative min-h-[95px] sm:min-h-[110px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-right group ${
                      !day.isCurrentMonth
                        ? 'opacity-35 bg-slate-50/50 border-slate-100 hover:opacity-75'
                        : isWeekend
                        ? 'bg-slate-50/40 border-slate-200/70 hover:bg-slate-50'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    } ${
                      isSelected
                        ? 'ring-2 ring-blue-600 bg-blue-50/80 border-blue-400 shadow-md transform -translate-y-0.5 z-10'
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

                    {/* Middle: Order count pill & driver chips */}
                    {count > 0 ? (
                      <div className="my-1 space-y-1">
                        <div
                          className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold flex items-center justify-between border ${workload.badgeBg} ${workload.badgeText} ${workload.borderColor}`}
                        >
                          <span>{count} הזמנות</span>
                          <span className="text-[9px] opacity-75 font-semibold">
                            {count >= 4 ? '🔥' : '🚚'}
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
                      <div className="my-1 flex items-center justify-center text-[10px] text-slate-300 group-hover:text-blue-500 transition">
                        <span className="opacity-0 group-hover:opacity-100 font-bold">+ פנוי</span>
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

                    {/* Active Triangle Arrow pointing downward */}
                    {isSelected && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rotate-45 z-20" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW MODE */}
        {calendarSubMode === 'week' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold pb-1">
              <span>תצוגת שבוע מרוכזת (7 ימים)</span>
              <span>לחץ על יום כדי לראות את כרטיסי העבודה המלאים</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {weekDays.map((wDay) => {
                const dayOrders = ordersByDate[wDay.dateString] || [];
                const count = dayOrders.length;
                const workload = getWorkloadInfo(count);
                const isSelected = selectedDate === wDay.dateString;

                return (
                  <div
                    key={wDay.dateString}
                    onClick={() => handleSelectDate(wDay.dateString)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between text-right ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white hover:bg-slate-50/90 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                        <span className="text-xs font-black text-slate-800">
                          {HEBREW_DAYS_FULL[wDay.dayOfWeek]}
                        </span>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${
                            wDay.isToday
                              ? 'bg-blue-600 text-white'
                              : isSelected
                              ? 'bg-blue-100 text-blue-900 font-black'
                              : 'text-slate-600'
                          }`}
                        >
                          {wDay.dayNumber}/{currentMonth + 1}
                        </span>
                      </div>

                      {/* Orders mini cards in this day */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {dayOrders.length === 0 ? (
                          <p className="text-[11px] text-slate-400 py-3 text-center">אין הזמנות</p>
                        ) : (
                          dayOrders.map((o) => (
                            <div
                              key={o.id}
                              className="p-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] space-y-0.5"
                            >
                              <div className="flex items-center justify-between font-bold text-slate-800">
                                <span className="truncate max-w-[90px]">{o.clientName}</span>
                                <span className="text-[9px] text-blue-600">{o.roundAndTime.split(' ')[0]}</span>
                              </div>
                              <p className="text-[9px] text-slate-500 truncate">{o.destinationAddress}</p>
                              <span className="inline-block text-[8px] font-bold px-1 rounded bg-slate-200 text-slate-700">
                                {o.driver.split(' ')[0]}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className={`font-bold ${workload.badgeText}`}>{count} משימות</span>
                      <span className="text-slate-400">{workload.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED DAY SCHEDULED ORDERS INSPECTOR (שכבת הזמנות מתוכננות ליום הנבחר) */}
      <div
        ref={dayOrdersSectionRef}
        className="win-card rounded-3xl p-5 sm:p-6 bg-white border-2 border-blue-200/90 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-3 duration-300"
      >
        {/* Layer Header: Day Date, Workload & Stats Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
              <CalendarIcon className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  הזמנות מתוכננות: {formatHebrewFullDate(selectedDate)}
                </h2>
                {selectedDate === '2026-09-13' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
                    היום המבצעי הפעיל
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${selectedDateWorkload.badgeBg} ${selectedDateWorkload.badgeText} ${selectedDateWorkload.borderColor}`}
                >
                  {selectedDateWorkload.label} • {selectedDayStats.total} הזמנות
                </span>
              </div>

              {/* Day Logistics Breakdown Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>חכמת מנוף: <strong>{selectedDayStats.hikmat}</strong></span>
                </span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                  <Truck className="w-3.5 h-3.5 text-sky-600" />
                  <span>עלי איסוזו: <strong>{selectedDayStats.ali}</strong></span>
                </span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>מחסן 4 / 1: <strong>{selectedDayStats.warehouse4} / {selectedDayStats.warehouse1}</strong></span>
                </span>
                {selectedDayStats.deposits > 0 && (
                  <span className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-amber-900 font-bold">
                    <Package className="w-3.5 h-3.5 text-amber-700" />
                    <span>פקדונות: {selectedDayStats.deposits} פריטים</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons for the selected day */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Driver Filter within this day */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
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
                type="button"
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
                type="button"
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

            {/* Broadcast day to WhatsApp */}
            <button
              type="button"
              onClick={handleCopyDayBroadcast}
              disabled={selectedDateOrders.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition active:scale-95"
              title="העתק סידור יומי מלא מוכן לשידור לקבוצת הנהגים"
            >
              {copiedDayBroadcast ? (
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
              type="button"
              onClick={() => onOpenNewOrder(selectedDate)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף הזמנה לתאריך זה</span>
            </button>
          </div>
        </div>

        {/* Multi-selection Bar for Bulk Navigation if supported */}
        {onToggleSelectOrder && onOpenBulkNavigate && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>בחירה מהירה לניווט:</span>
              </span>
              {onSelectAllForDriver && (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectAllForDriver('חכמת')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold transition flex items-center gap-1"
                  >
                    <span>בחר הכל לחכמת 🏗️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectAllForDriver('עלי')}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold transition flex items-center gap-1"
                  >
                    <span>בחר הכל לעלי 🚚</span>
                  </button>
                </>
              )}
              {selectedOrderIds.length > 0 && onClearSelection && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-700 font-medium transition"
                >
                  נקה בחירה ({selectedOrderIds.length})
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenBulkNavigate()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-black shadow-xs transition active:scale-95"
            >
              <Route className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {selectedOrderIds.length > 0
                  ? `ניווט מרוכז (${selectedOrderIds.length} נבחרו) 🗺️`
                  : 'ניווט מרוכז (Bulk Navigate) 🗺️'}
              </span>
            </button>
          </div>
        )}

        {/* Selected Orders Banner */}
        {selectedOrderIds.length > 0 && onOpenBulkNavigate && onClearSelection && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black flex-shrink-0">
                {selectedOrderIds.length}
              </div>
              <div>
                <h4 className="text-xs font-black">
                  נבחרו {selectedOrderIds.length} הזמנות עבור מסלול ניווט מרוכז ב-Waze
                </h4>
                <p className="text-[11px] text-blue-100">
                  איחוד אוטומטי של התחנות ברצף אופטימלי והפקת לינק מקוצר לנהג
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onClearSelection}
                className="px-2.5 py-1.5 rounded-xl text-blue-200 hover:text-white text-xs font-bold transition"
              >
                בטל בחירה
              </button>

              <button
                type="button"
                onClick={() => onOpenBulkNavigate()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-black text-xs shadow-md transition active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>פתח מחולל מסלול 🚀</span>
              </button>
            </div>
          </div>
        )}

        {/* Day Orders Grid */}
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
                המשאיות וצוות המנוף פנויים. לחץ על הכפתור מטה כדי לשבץ אספקה חדשה לתאריך זה.
              </p>
            </div>
            <button
              type="button"
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
                isSelected={selectedOrderIds.includes(order.id)}
                onToggleSelect={onToggleSelectOrder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
