import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Truck,
  Package,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Info,
  Flame,
  Award,
  Filter,
  ArrowDownUp,
  Building2,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { Order } from '../types';
import { extractOrderDate, HEBREW_DAYS_SHORT } from '../lib/dateUtils';

// Palette definitions for Drivers & Product Categories
export const DRIVER_COLORS: Record<string, { bg: string; fill: string; border: string; name: string }> = {
  hikmat: {
    name: 'חכמת (מרצדס מנוף)',
    fill: '#2563eb', // Blue 600
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  ali: {
    name: 'עלי (משאית איסוזו)',
    fill: '#059669', // Emerald 600
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  other: {
    name: 'אחר / לא משובץ',
    fill: '#94a3b8', // Slate 400
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
};

export const PRODUCT_CATEGORIES = [
  {
    id: 'drywall',
    label: 'גבס ופרופילים',
    keywords: ['גבס', 'לוח', 'ניצב', 'מסלול', 'אומגה', 'פרופיל', 'שפכטל', '4k', 'mp75'],
    fill: '#3b82f6', // Blue
    icon: '🏗️',
  },
  {
    id: 'cement',
    label: 'מלט וטיט',
    keywords: ['מלט', 'טיט', 'צמנט', 'פורטלנד', 'נשר'],
    fill: '#f59e0b', // Amber
    icon: '🧱',
  },
  {
    id: 'aggregates',
    label: 'חול וסומסום',
    keywords: ['חול', 'סומסום', 'בלה', 'מחצבה', 'חצץ', 'מצע'],
    fill: '#10b981', // Emerald
    icon: '🏖️',
  },
  {
    id: 'blocks',
    label: 'בלוקים ולבנים',
    keywords: ['בלוק', 'איטונג', 'לבנה'],
    fill: '#8b5cf6', // Violet
    icon: '🧱',
  },
  {
    id: 'adhesives',
    label: 'דבקים ואיטום',
    keywords: ['דבק', 'קרמיקה', 'ריצופית', 'פלסטומר', 'רובה', 'איטום', 'ביטומן', 'סילר'],
    fill: '#f43f5e', // Rose
    icon: '💧',
  },
];

export interface DemandProductItem {
  id: string;
  name: string;
  shortName: string;
  category: string;
  orderCount: number;
  totalQuantity: number;
  unit: string;
  color: string;
  warehouse: string;
  icon: string;
  trend: 'high' | 'medium' | 'steady';
}

/**
 * Classifies an order's products into matching categories
 */
export function classifyOrderProducts(productsSummary: string = ''): string[] {
  const text = productsSummary.toLowerCase();
  const matchedCategories: string[] = [];

  for (const cat of PRODUCT_CATEGORIES) {
    const hasMatch = cat.keywords.some((kw) => text.includes(kw.toLowerCase()));
    if (hasMatch) {
      matchedCategories.push(cat.id);
    }
  }

  return matchedCategories.length > 0 ? matchedCategories : ['other'];
}

interface WeeklyOrdersAnalyticsChartProps {
  orders: Order[];
  className?: string;
}

export const WeeklyOrdersAnalyticsChart: React.FC<WeeklyOrdersAnalyticsChartProps> = ({
  orders,
  className = '',
}) => {
  // Chart Mode: 'driver' (לפי נהג) | 'product' (לפי סוג מוצר) | 'demand' (ביקוש פריטים)
  const [metricMode, setMetricMode] = useState<'driver' | 'product' | 'demand'>('driver');
  // Visualization Type: 'bar' (עמודות יומיות) or 'pie' (פילוח עוגה)
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  // Product Demand Specific Controls
  const [demandSortBy, setDemandSortBy] = useState<'orders' | 'quantity'>('orders');
  const [demandWarehouseFilter, setDemandWarehouseFilter] = useState<'all' | 'wh4' | 'wh1'>('all');
  const [demandLimit, setDemandLimit] = useState<number>(8);

  // Define the past week dates (7 operational days: 2026-09-09 to 2026-09-15)
  const pastWeekDates = useMemo(() => {
    return [
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
    ];
  }, []);

  // Filter orders within the past week
  const weekOrders = useMemo(() => {
    const weekSet = new Set(pastWeekDates);
    return orders.filter((o) => weekSet.has(extractOrderDate(o)));
  }, [orders, pastWeekDates]);

  // Total orders in week
  const totalWeekOrders = weekOrders.length;

  // Daily Bar Chart Data (for Driver & Category modes)
  const dailyBarData = useMemo(() => {
    return pastWeekDates.map((dateStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayShort = HEBREW_DAYS_SHORT[dateObj.getDay()] || '';
      const dayLabel = `${dayShort} (${d}/${m})`;

      const dayOrders = orders.filter((o) => extractOrderDate(o) === dateStr);

      if (metricMode === 'driver') {
        let hikmatCount = 0;
        let aliCount = 0;
        let otherCount = 0;

        dayOrders.forEach((o) => {
          if (o.driver.includes('חכמת')) {
            hikmatCount += 1;
          } else if (o.driver.includes('עלי')) {
            aliCount += 1;
          } else {
            otherCount += 1;
          }
        });

        return {
          date: dateStr,
          dayLabel,
          total: dayOrders.length,
          'חכמת (מרצדס מנוף)': hikmatCount,
          'עלי (משאית איסוזו)': aliCount,
          'אחר / לא משובץ': otherCount,
        };
      } else {
        // Product category mode
        const catCounts: Record<string, number> = {
          'גבס ופרופילים': 0,
          'מלט וטיט': 0,
          'חול וסומסום': 0,
          'בלוקים ולבנים': 0,
          'דבקים ואיטום': 0,
        };

        dayOrders.forEach((o) => {
          const matched = classifyOrderProducts(o.productsSummary);
          PRODUCT_CATEGORIES.forEach((cat) => {
            if (matched.includes(cat.id)) {
              catCounts[cat.label] = (catCounts[cat.label] || 0) + 1;
            }
          });
        });

        return {
          date: dateStr,
          dayLabel,
          total: dayOrders.length,
          ...catCounts,
        };
      }
    });
  }, [pastWeekDates, orders, metricMode]);

  // Aggregate Driver Summary Data
  const driverSummary = useMemo(() => {
    let hikmat = 0;
    let ali = 0;
    let other = 0;

    weekOrders.forEach((o) => {
      if (o.driver.includes('חכמת')) {
        hikmat += 1;
      } else if (o.driver.includes('עלי')) {
        ali += 1;
      } else {
        other += 1;
      }
    });

    return [
      {
        id: 'hikmat',
        name: 'חכמת (מרצדס מנוף)',
        count: hikmat,
        percentage: totalWeekOrders > 0 ? Math.round((hikmat / totalWeekOrders) * 100) : 0,
        fill: DRIVER_COLORS.hikmat.fill,
        truckType: 'משאית כבדה + זרוע מנוף',
      },
      {
        id: 'ali',
        name: 'עלי (משאית איסוזו)',
        count: ali,
        percentage: totalWeekOrders > 0 ? Math.round((ali / totalWeekOrders) * 100) : 0,
        fill: DRIVER_COLORS.ali.fill,
        truckType: 'משאית חלוקה מהירה',
      },
      ...(other > 0
        ? [
            {
              id: 'other',
              name: 'אחר / לא משובץ',
              count: other,
              percentage: totalWeekOrders > 0 ? Math.round((other / totalWeekOrders) * 100) : 0,
              fill: DRIVER_COLORS.other.fill,
              truckType: 'הזמנות בהמתנה',
            },
          ]
        : []),
    ];
  }, [weekOrders, totalWeekOrders]);

  // Aggregate Product Categories Summary Data
  const productSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    PRODUCT_CATEGORIES.forEach((c) => {
      counts[c.id] = 0;
    });

    weekOrders.forEach((o) => {
      const matched = classifyOrderProducts(o.productsSummary);
      matched.forEach((catId) => {
        if (counts[catId] !== undefined) {
          counts[catId] += 1;
        }
      });
    });

    return PRODUCT_CATEGORIES.map((cat) => {
      const count = counts[cat.id] || 0;
      return {
        id: cat.id,
        name: cat.label,
        count,
        percentage: totalWeekOrders > 0 ? Math.round((count / totalWeekOrders) * 100) : 0,
        fill: cat.fill,
        icon: cat.icon,
      };
    }).sort((a, b) => b.count - a.count);
  }, [weekOrders, totalWeekOrders]);

  // Data for PieChart
  const pieChartData = useMemo(() => {
    if (metricMode === 'driver') {
      return driverSummary.map((d) => ({
        name: d.name,
        value: d.count,
        fill: d.fill,
      }));
    } else {
      return productSummary.map((p) => ({
        name: `${p.icon} ${p.name}`,
        value: p.count,
        fill: p.fill,
      }));
    }
  }, [metricMode, driverSummary, productSummary]);

  // ==========================================
  // PRODUCT DEMAND (Item-Level Demand Analysis)
  // ==========================================
  const productDemandList = useMemo(() => {
    // Template catalog items
    const itemsCatalog: Record<string, {
      name: string;
      shortName: string;
      category: string;
      unit: string;
      color: string;
      warehouse: string;
      icon: string;
      pattern: RegExp;
      qtyExtractor: RegExp;
    }> = {
      plaster_boards: {
        name: 'לוחות גבס (לבן / ירוק / 4K)',
        shortName: 'לוחות גבס',
        category: 'גבס ופרופילים',
        unit: 'לוחות',
        color: '#3b82f6', // Blue
        warehouse: 'מחסן 1 (התלמיד)',
        icon: '🏗️',
        pattern: /(?:לוח|לוחות|גבס|4k)/i,
        qtyExtractor: /(\d+)\s*(?:לוח|לוחות|גבס|4k)/i,
      },
      sumsum: {
        name: 'סומסום נקי (בלות / מצע)',
        shortName: 'סומסום בלה',
        category: 'חול וסומסום',
        unit: 'בלות',
        color: '#10b981', // Emerald
        warehouse: 'מחסן 4 (החרש)',
        icon: '🏖️',
        pattern: /סומסום/i,
        qtyExtractor: /(\d+)\s*(?:בלות\s*)?סומסום/i,
      },
      ready_mortar: {
        name: 'טיט מוכן (שקים / בלות)',
        shortName: 'טיט מוכן',
        category: 'מלט וטיט',
        unit: 'שקים/בלות',
        color: '#f59e0b', // Amber
        warehouse: 'מחסן 4 (החרש)',
        icon: '🧱',
        pattern: /טיט/i,
        qtyExtractor: /(\d+)\s*(?:שקי\s*)?טיט/i,
      },
      cement_nesher: {
        name: 'מלט נשר וצמנט פורטלנד',
        shortName: 'מלט נשר',
        category: 'מלט וטיט',
        unit: 'שקים',
        color: '#d97706', // Darker Amber
        warehouse: 'מחסן 4 (החרש)',
        icon: '🧱',
        pattern: /(?:מלט|צמנט)/i,
        qtyExtractor: /(\d+)\s*(?:שקי\s*)?(?:מלט|צמנט)/i,
      },
      profiles_studs: {
        name: 'ניצבים ומסלולים 50 / 70',
        shortName: 'ניצבים ומסלולים',
        category: 'גבס ופרופילים',
        unit: 'יח׳',
        color: '#6366f1', // Indigo
        warehouse: 'מחסן 1 (התלמיד)',
        icon: '📏',
        pattern: /(?:ניצב|מסלול)/i,
        qtyExtractor: /(\d+)\s*(?:ניצב|מסלול)/i,
      },
      ceramic_adhesive: {
        name: 'דבק קרמיקה 114 מקצועי',
        shortName: 'דבק קרמיקה 114',
        category: 'דבקים ואיטום',
        unit: 'שקים',
        color: '#f43f5e', // Rose
        warehouse: 'מחסן 1 (התלמיד)',
        icon: '💧',
        pattern: /(?:114|דבק\s*קרמיקה)/i,
        qtyExtractor: /(\d+)\s*(?:שקי\s*)?(?:דבק|114)/i,
      },
      sea_sand: {
        name: 'חול ים מחצבה (בלות)',
        shortName: 'חול ים',
        category: 'חול וסומסום',
        unit: 'בלות',
        color: '#059669', // Deep Emerald
        warehouse: 'מחסן 4 (החרש)',
        icon: '🏖️',
        pattern: /חול/i,
        qtyExtractor: /(\d+)\s*(?:בלות\s*)?חול/i,
      },
      blocks_20: {
        name: 'משטחי בלוק 20 ו-15 תקני',
        shortName: 'בלוק 20/15',
        category: 'בלוקים ולבנים',
        unit: 'משטחים',
        color: '#8b5cf6', // Violet
        warehouse: 'מחסן 4 (החרש)',
        icon: '🧱',
        pattern: /בלוק/i,
        qtyExtractor: /(\d+)\s*(?:משטחי\s*)?בלוק/i,
      },
      ritsofit_grey: {
        name: 'ריצופית אפור ופלסטומר 603',
        shortName: 'ריצופית ופלסטומר',
        category: 'דבקים ואיטום',
        unit: 'שקים',
        color: '#fb7185', // Soft Rose
        warehouse: 'מחסן 4 (החרש)',
        icon: '🛡️',
        pattern: /(?:ריצופית|פלסטומר)/i,
        qtyExtractor: /(\d+)\s*(?:ריצופית|פלסטומר)/i,
      },
      spachtel: {
        name: 'שפכטל אמריקאי וטיח MP75',
        shortName: 'שפכטל וטיח MP75',
        category: 'גבס ופרופילים',
        unit: 'שקים',
        color: '#0ea5e9', // Sky Blue
        warehouse: 'מחסן 1 (התלמיד)',
        icon: '🎨',
        pattern: /(?:שפכטל|mp75)/i,
        qtyExtractor: /(\d+)\s*(?:שקי\s*)?(?:שפכטל|mp75)/i,
      },
    };

    // Tally demand across filtered week orders
    const tallies: Record<string, { orderCount: number; totalQuantity: number }> = {};
    Object.keys(itemsCatalog).forEach((key) => {
      tallies[key] = { orderCount: 0, totalQuantity: 0 };
    });

    weekOrders.forEach((order) => {
      // Warehouse filter
      if (demandWarehouseFilter === 'wh4' && !order.warehouse.includes('החרש')) return;
      if (demandWarehouseFilter === 'wh1' && !order.warehouse.includes('התלמיד')) return;

      const summary = order.productsSummary || '';

      Object.entries(itemsCatalog).forEach(([key, itemDef]) => {
        if (itemDef.pattern.test(summary)) {
          tallies[key].orderCount += 1;

          // Attempt quantity extraction
          const match = summary.match(itemDef.qtyExtractor);
          if (match && match[1]) {
            tallies[key].totalQuantity += parseInt(match[1], 10) || 1;
          } else {
            tallies[key].totalQuantity += 1;
          }
        }
      });
    });

    // Transform to formatted list
    const results: DemandProductItem[] = Object.entries(itemsCatalog)
      .map(([key, itemDef]) => {
        const stats = tallies[key];
        let trend: 'high' | 'medium' | 'steady' = 'steady';
        if (stats.orderCount >= 5) trend = 'high';
        else if (stats.orderCount >= 3) trend = 'medium';

        return {
          id: key,
          name: itemDef.name,
          shortName: itemDef.shortName,
          category: itemDef.category,
          orderCount: stats.orderCount,
          totalQuantity: stats.totalQuantity,
          unit: itemDef.unit,
          color: itemDef.color,
          warehouse: itemDef.warehouse,
          icon: itemDef.icon,
          trend,
        };
      })
      .filter((item) => item.orderCount > 0);

    // Sort by chosen metric: order frequency vs total quantity
    if (demandSortBy === 'orders') {
      results.sort((a, b) => b.orderCount - a.orderCount || b.totalQuantity - a.totalQuantity);
    } else {
      results.sort((a, b) => b.totalQuantity - a.totalQuantity || b.orderCount - a.orderCount);
    }

    return results;
  }, [weekOrders, demandWarehouseFilter, demandSortBy]);

  // Sliced data for the Recharts Bar Chart
  const demandChartData = useMemo(() => {
    return productDemandList.slice(0, demandLimit).map((item, idx) => ({
      name: item.shortName,
      fullName: item.name,
      orderCount: item.orderCount,
      totalQuantity: item.totalQuantity,
      unit: item.unit,
      category: item.category,
      warehouse: item.warehouse,
      icon: item.icon,
      color: item.color,
      rank: idx + 1,
    }));
  }, [productDemandList, demandLimit]);

  // Custom Tooltips for Recharts
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalInDay = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[180px] font-sans text-right" dir="rtl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60 font-black text-slate-200">
            <span>{label}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
              סה"כ: {totalInDay} הזמנות
            </span>
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              if (Number(entry.value) === 0) return null;
              return (
                <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color || entry.fill }}
                    />
                    <span className="text-slate-300 truncate max-w-[130px]">{entry.name}</span>
                  </div>
                  <span className="font-extrabold text-white">{entry.value} הזמנות</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = totalWeekOrders > 0 ? Math.round((Number(item.value) / totalWeekOrders) * 100) : 0;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs text-right font-sans" dir="rtl">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.payload?.fill || item.color }}
            />
            <span className="font-bold text-slate-100">{item.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>כמות הזמנות:</span>
            <strong className="text-white font-extrabold">{item.value}</strong>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>אחוז מסך השבוע:</span>
            <strong className="text-emerald-400 font-extrabold">{percent}%</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // Dedicated Product Demand Bar Chart Tooltip
  const CustomDemandTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentOfOrders = totalWeekOrders > 0 ? Math.round((item.orderCount / totalWeekOrders) * 100) : 0;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 text-xs text-right min-w-[210px] font-sans" dir="rtl">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-700/60 font-black text-slate-100">
            <span className="text-base">{item.icon}</span>
            <div>
              <div className="text-xs font-black">{item.fullName}</div>
              <div className="text-[10px] text-slate-400 font-normal">קטגוריה: {item.category}</div>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span>תדירות הופעה בהזמנות:</span>
              <strong className="text-white font-black text-xs">{item.orderCount} הזמנות</strong>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>סה״כ יחידות שהוזמנו:</span>
              <strong className="text-blue-400 font-black text-xs">
                {item.totalQuantity} {item.unit}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>אחוז מכלל הזמנות השבוע:</span>
              <strong className="text-emerald-400 font-black">{percentOfOrders}%</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800 text-[10px]">
              <span>מחסן שיוך עיקרי:</span>
              <span className="text-slate-300 font-bold">{item.warehouse}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`win-card rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-6 ${className}`} dir="rtl">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & MAIN CONTROLS */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center flex-shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                ניתוח פעילות והזמנות — השבוע האחרון
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                09/09 - 15/09
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              התפלגות עומסי אספקה שבועיים, ביצועי נהגים וביקוש לפריטי חומרי בניין
            </p>
          </div>
        </div>

        {/* Dimension Selector: Driver vs Product Type vs Product Demand */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex items-center">
            <button
              onClick={() => setMetricMode('driver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metricMode === 'driver'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>לפי נהג 🚛</span>
            </button>
            <button
              onClick={() => setMetricMode('product')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metricMode === 'product'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>לפי סוג מוצר 🧱</span>
            </button>
            <button
              onClick={() => setMetricMode('demand')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metricMode === 'demand'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>ביקוש מוצרים 🔥</span>
            </button>
          </div>

          {/* Chart Type Toggle (Bar vs Pie - enabled for Driver & Product category modes) */}
          {metricMode !== 'demand' && (
            <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex items-center">
              <button
                onClick={() => setChartType('bar')}
                title="תצוגת עמודות יומיות"
                className={`p-1.5 rounded-xl transition ${
                  chartType === 'bar'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('pie')}
                title="תצוגת עוגת התפלגות"
                className={`p-1.5 rounded-xl transition ${
                  chartType === 'pie'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <PieChartIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PRIMARY VIEW: WEEKLY TIMELINE OR FULL PRODUCT DEMAND */}
      {/* ======================================================== */}
      {metricMode !== 'demand' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Recharts Canvas Container */}
          <div className="lg:col-span-8 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 relative min-h-[310px]">
            {chartType === 'bar' ? (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyBarData}
                    margin={{ top: 15, right: 10, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="dayLabel"
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: 12, fontSize: 11, fontWeight: 700 }}
                    />

                    {metricMode === 'driver' ? (
                      <>
                        <Bar
                          dataKey="חכמת (מרצדס מנוף)"
                          stackId="orders"
                          fill={DRIVER_COLORS.hikmat.fill}
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="עלי (משאית איסוזו)"
                          stackId="orders"
                          fill={DRIVER_COLORS.ali.fill}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="אחר / לא משובץ"
                          stackId="orders"
                          fill={DRIVER_COLORS.other.fill}
                          radius={[4, 4, 0, 0]}
                        />
                      </>
                    ) : (
                      <>
                        <Bar
                          dataKey="מלט וטיט"
                          stackId="products"
                          fill="#f59e0b"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="גבס ופרופילים"
                          stackId="products"
                          fill="#3b82f6"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="חול וסומסום"
                          stackId="products"
                          fill="#10b981"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="דבקים ואיטום"
                          stackId="products"
                          fill="#f43f5e"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="בלוקים ולבנים"
                          stackId="products"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: 10, fontSize: 11, fontWeight: 700 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="absolute top-2 left-2 text-[10px] text-slate-400 font-bold bg-white/80 px-2 py-0.5 rounded-md border border-slate-100">
              גרף Recharts אינטראקטיבי
            </div>
          </div>

          {/* Summary Side Cards */}
          <div className="lg:col-span-4 space-y-3">
            {/* Top Metric Header */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/40 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500">סה"כ הזמנות השבוע</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {totalWeekOrders} <span className="text-xs font-bold text-slate-500">הזמנות</span>
                </div>
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400">ממוצע ליום</span>
                <div className="text-sm font-black text-blue-700">
                  {(totalWeekOrders / 7).toFixed(1)} / יום
                </div>
              </div>
            </div>

            {/* Breakdown Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {metricMode === 'driver' ? (
                driverSummary.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-200 transition shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="font-extrabold text-slate-900">{item.name}</span>
                      </div>
                      <span className="font-black text-slate-900">
                        {item.count} <span className="text-[10px] text-slate-400 font-normal">הזמנות</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>{item.truckType}</span>
                      <span className="font-bold text-slate-600">{item.percentage}% מנפח ההזמנות</span>
                    </div>
                  </div>
                ))
              ) : (
                productSummary.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-200 transition shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span className="font-extrabold text-slate-900">{cat.name}</span>
                      </div>
                      <span className="font-black text-slate-900">
                        {cat.count} <span className="text-[10px] text-slate-400 font-normal">הזמנות</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.fill,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>קטגוריית ליבה</span>
                      <span className="font-bold text-slate-600">{cat.percentage}% מההזמנות</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ======================================================== */}
      {/* 3. DEDICATED 'PRODUCT DEMAND' SECTION (ביקוש פריטים מבוקשים) */}
      {/* ======================================================== */}
      <div className={`space-y-4 ${metricMode !== 'demand' ? 'pt-5 border-t border-slate-100' : ''}`}>
        {/* Section Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900 tracking-tight">
                  ביקוש מוצרים ופריטים מובילים — Product Demand
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                  טופ ביקושים 🏆
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                הפריטים השכיחים ביותר בהזמנות השבוע האחרון לפי תדירות הופעה וכמויות יחידות
              </p>
            </div>
          </div>

          {/* Sub-Filters for Demand */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle: Order Frequency vs Total Quantity */}
            <div className="bg-white p-1 rounded-xl border border-amber-200/90 shadow-2xs flex items-center">
              <button
                onClick={() => setDemandSortBy('orders')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  demandSortBy === 'orders'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>לפי תדירות הזמנות</span>
              </button>
              <button
                onClick={() => setDemandSortBy('quantity')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  demandSortBy === 'quantity'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>לפי כמות יחידות</span>
              </button>
            </div>

            {/* Warehouse Filter */}
            <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center text-[11px] font-semibold text-slate-600">
              <button
                onClick={() => setDemandWarehouseFilter('all')}
                className={`px-2 py-1 rounded-lg transition ${
                  demandWarehouseFilter === 'all'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                הכל
              </button>
              <button
                onClick={() => setDemandWarehouseFilter('wh4')}
                className={`px-2 py-1 rounded-lg transition ${
                  demandWarehouseFilter === 'wh4'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                מחסן 4
              </button>
              <button
                onClick={() => setDemandWarehouseFilter('wh1')}
                className={`px-2 py-1 rounded-lg transition ${
                  demandWarehouseFilter === 'wh1'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                מחסן 1
              </button>
            </div>
          </div>
        </div>

        {/* Product Demand Visual Content: Recharts Bar Chart (Left) + Top Demand Leaderboard (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Recharts Vertical Bar Chart (Horizontal Bars) */}
          <div className="lg:col-span-8 bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 relative">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>
                  {demandSortBy === 'orders'
                    ? 'גרף תדירות הזמנות לפריט (כמה פעמים הוזמן השבוע)'
                    : 'גרף כמות יחידות מצטברת (שקים, לוחות, בלות ומשטחים)'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {demandChartData.length} פריטים בדירוג
              </span>
            </div>

            {demandChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                <Boxes className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-bold">לא נמצאו פריטים תואמים לסינון</p>
              </div>
            ) : (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={demandChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 700 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip content={<CustomDemandTooltip />} />
                    <Bar
                      dataKey={demandSortBy === 'orders' ? 'orderCount' : 'totalQuantity'}
                      name={demandSortBy === 'orders' ? 'הזמנות' : 'כמות'}
                      radius={[0, 6, 6, 0]}
                    >
                      {demandChartData.map((entry, index) => (
                        <Cell key={`demand-bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
              <span>💡 ריחוף על עמודה מציג פירוט מלא: כמויות, אחוז מההזמנות ומחסן מוביל</span>
              <span className="font-bold text-amber-700">Recharts Demand Engine</span>
            </div>
          </div>

          {/* Top In-Demand Podium Cards (Right Column) */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>מובילי הביקוש בח. סבן</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">קצב משיכה שבועי</span>
            </div>

            {demandChartData.slice(0, 4).map((item, idx) => (
              <div
                key={`demand-card-${item.name}`}
                className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-amber-300 hover:shadow-xs transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs font-black text-slate-900 truncate max-w-[130px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-amber-600 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100">
                    {item.orderCount} הזמנות
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="text-slate-400">{item.warehouse}</span>
                  <span className="font-extrabold text-slate-800">
                    סה״כ {item.totalQuantity} {item.unit}
                  </span>
                </div>
              </div>
            ))}

            {/* Quick Operational Advisory Note */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>המלצת מלאי שבועית — נועה AI</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-blue-700/90">
                ביקוש גבוה במיוחד ללוחות גבס במחסן 1 וסומסום בלות במחסן 4. מומלץ לוודא מלאי ביטחון להעמסות בוקר.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
