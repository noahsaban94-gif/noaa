import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Flame,
  BarChart3,
  Award,
  Package,
  Layers,
  Building2,
  Boxes,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { Order } from '../types';

export interface TopProductItem {
  id: string;
  name: string;
  shortName: string;
  category: string;
  orderCount: number; // שכיחות הופעה במספר הזמנות
  frequencyPercent: number; // אחוז מכלל ההזמנות
  totalQuantity: number; // כמות כוללת משוערת
  unit: string;
  color: string;
  warehouse: string;
  icon: string;
  rank: number;
}

interface TopProductsChartProps {
  orders: Order[];
  className?: string;
}

// Canonical Catalog Definition with keywords and quantity extraction patterns
const KNOWN_CATALOG: Array<{
  id: string;
  name: string;
  shortName: string;
  category: string;
  unit: string;
  color: string;
  warehouse: string;
  icon: string;
  pattern: RegExp;
  qtyExtractor: RegExp;
}> = [
  {
    id: 'plaster_boards',
    name: 'לוחות גבס (לבן / ירוק / 4K)',
    shortName: 'לוחות גבס',
    category: 'גבס ופרופילים',
    unit: 'לוחות',
    color: '#2563eb', // Blue
    warehouse: 'מחסן 1 (התלמיד)',
    icon: '🏗️',
    pattern: /(?:לוח|לוחות|גבס|4k)/i,
    qtyExtractor: /(\d+)\s*(?:לוח|לוחות|גבס|4k)/i,
  },
  {
    id: 'cement_nesher',
    name: 'מלט נשר וצמנט פורטלנד',
    shortName: 'מלט נשר / צמנט',
    category: 'מלט וטיט',
    unit: 'שקים',
    color: '#d97706', // Amber 600
    warehouse: 'מחסן 4 (החרש)',
    icon: '🧱',
    pattern: /(?:מלט|צמנט|נשר)/i,
    qtyExtractor: /(\d+)\s*(?:שקי\s*)?(?:מלט|צמנט|נשר)/i,
  },
  {
    id: 'sumsum',
    name: 'סומסום נקי (בלות / מצע)',
    shortName: 'סומסום בלה',
    category: 'חול וסומסום',
    unit: 'בלות',
    color: '#10b981', // Emerald 500
    warehouse: 'מחסן 4 (החרש)',
    icon: '🏖️',
    pattern: /סומסום/i,
    qtyExtractor: /(\d+)\s*(?:בלות\s*)?סומסום/i,
  },
  {
    id: 'sea_sand',
    name: 'חול ים מחצבה (בלות)',
    shortName: 'חול ים',
    category: 'חול וסומסום',
    unit: 'בלות',
    color: '#059669', // Emerald 600
    warehouse: 'מחסן 4 (החרש)',
    icon: '🏖️',
    pattern: /חול/i,
    qtyExtractor: /(\d+)\s*(?:בלות\s*)?חול/i,
  },
  {
    id: 'ready_mortar',
    name: 'טיט מוכן (שקים / בלות)',
    shortName: 'טיט מוכן',
    category: 'מלט וטיט',
    unit: 'שקים/בלות',
    color: '#f59e0b', // Amber 500
    warehouse: 'מחסן 4 (החרש)',
    icon: '🧱',
    pattern: /טיט/i,
    qtyExtractor: /(\d+)\s*(?:שקי\s*|בלות\s*)?טיט/i,
  },
  {
    id: 'blocks_20_15',
    name: 'משטחי בלוק 20 ו-15 תקני',
    shortName: 'בלוק 20 / 15',
    category: 'בלוקים ולבנים',
    unit: 'משטחים',
    color: '#8b5cf6', // Violet 500
    warehouse: 'מחסן 4 (החרש)',
    icon: '🧱',
    pattern: /(?:בלוק|איטונג)/i,
    qtyExtractor: /(\d+)\s*(?:משטחי\s*|משטח\s*)?בלוק/i,
  },
  {
    id: 'ceramic_adhesive',
    name: 'דבק קרמיקה 114 מקצועי',
    shortName: 'דבק קרמיקה 114',
    category: 'דבקים ואיטום',
    unit: 'שקים',
    color: '#f43f5e', // Rose 500
    warehouse: 'מחסן 1 (התלמיד)',
    icon: '💧',
    pattern: /(?:114|דבק\s*קרמיקה)/i,
    qtyExtractor: /(\d+)\s*(?:שקי\s*)?(?:דבק|114)/i,
  },
  {
    id: 'profiles_studs',
    name: 'ניצבים ומסלולים 50 / 70 (גבס)',
    shortName: 'ניצבים ומסלולים',
    category: 'גבס ופרופילים',
    unit: 'יח׳',
    color: '#6366f1', // Indigo 500
    warehouse: 'מחסן 1 (התלמיד)',
    icon: '📏',
    pattern: /(?:ניצב|מסלול|פרופיל|אומגה)/i,
    qtyExtractor: /(\d+)\s*(?:ניצב|מסלול|פרופיל)/i,
  },
  {
    id: 'ritsofit_plastomer',
    name: 'ריצופית אפור ופלסטומר 603',
    shortName: 'ריצופית ופלסטומר',
    category: 'דבקים ואיטום',
    unit: 'שקים',
    color: '#ec4899', // Pink 500
    warehouse: 'מחסן 4 (החרש)',
    icon: '🛡️',
    pattern: /(?:ריצופית|פלסטומר)/i,
    qtyExtractor: /(\d+)\s*(?:שקי\s*)?(?:ריצופית|פלסטומר)/i,
  },
  {
    id: 'spachtel_american',
    name: 'שפכטל אמריקאי וטיח MP75',
    shortName: 'שפכטל אמריקאי',
    category: 'גבס ופרופילים',
    unit: 'שקים',
    color: '#0ea5e9', // Sky 500
    warehouse: 'מחסן 1 (התלמיד)',
    icon: '🎨',
    pattern: /(?:שפכטל|mp75|טיח)/i,
    qtyExtractor: /(\d+)\s*(?:שקי\s*)?(?:שפכטל|mp75)/i,
  },
  {
    id: 'grout_sealing',
    name: 'רובה אפורה וחומרי איטום',
    shortName: 'רובה ואיטום',
    category: 'דבקים ואיטום',
    unit: 'יח׳',
    color: '#14b8a6', // Teal 500
    warehouse: 'מחסן 1 (התלמיד)',
    icon: '🧪',
    pattern: /(?:רובה|איטום|סיליקון|סילר)/i,
    qtyExtractor: /(\d+)\s*(?:יח׳\s*|פחיות\s*)?(?:רובה|איטום)/i,
  },
  {
    id: 'crane_transport',
    name: 'הובלת מנוף ופריקת זרוע',
    shortName: 'הובלת מנוף',
    category: 'שירותי מנוף',
    unit: 'פריקות',
    color: '#64748b', // Slate 500
    warehouse: 'מחסן 4 (החרש)',
    icon: '🏗️',
    pattern: /(?:מנוף|הנפה)/i,
    qtyExtractor: /(\d+)\s*(?:הובלת\s*)?מנוף/i,
  },
];

export const TopProductsChart: React.FC<TopProductsChartProps> = ({
  orders,
  className = '',
}) => {
  // Metric displayed: 'frequency' (שכיחות בהזמנות) | 'quantity' (כמות יחידות כוללת)
  const [metricType, setMetricType] = useState<'frequency' | 'quantity'>('frequency');

  // Display Limit (Top 5 / 8 / 10 / all)
  const [displayLimit, setDisplayLimit] = useState<number>(8);

  // Warehouse filter
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | 'wh4' | 'wh1'>('all');

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Orientation of bars: 'horizontal' (bars go right to left / left to right) or 'vertical'
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Total orders in the sheet
  const totalOrdersCount = orders.length;

  // =========================================================================
  // DYNAMIC FREQUENCY ANALYSIS ENGINE BASED ON productsSummary
  // =========================================================================
  const topProductsList = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // Initialize tallies for canonical items
    const canonicalTallies: Record<
      string,
      { orderCount: number; totalQuantity: number; matchedOrderIds: Set<string> }
    > = {};

    KNOWN_CATALOG.forEach((item) => {
      canonicalTallies[item.id] = {
        orderCount: 0,
        totalQuantity: 0,
        matchedOrderIds: new Set(),
      };
    });

    // Dynamic unmapped tokens bucket (for any free-text product entered in sheets)
    const dynamicUnmappedTallies: Record<
      string,
      {
        rawName: string;
        orderCount: number;
        totalQuantity: number;
        matchedOrderIds: Set<string>;
        warehouse: string;
      }
    > = {};

    // Analyze each order's productsSummary
    orders.forEach((order) => {
      // Warehouse filter check
      if (warehouseFilter === 'wh4' && !order.warehouse.includes('החרש') && !order.warehouse.includes('4')) {
        return;
      }
      if (warehouseFilter === 'wh1' && !order.warehouse.includes('התלמיד') && !order.warehouse.includes('1')) {
        return;
      }

      const summary = order.productsSummary || '';
      if (!summary.trim()) return;

      // Track which canonical items were matched for THIS order (prevent double counting in same order)
      const matchedInOrder = new Set<string>();

      // 1. Match canonical catalog items
      KNOWN_CATALOG.forEach((item) => {
        if (item.pattern.test(summary)) {
          matchedInOrder.add(item.id);
          canonicalTallies[item.id].orderCount += 1;
          canonicalTallies[item.id].matchedOrderIds.add(order.id);

          // Extract quantity
          const qtyMatch = summary.match(item.qtyExtractor);
          if (qtyMatch && qtyMatch[1]) {
            canonicalTallies[item.id].totalQuantity += parseInt(qtyMatch[1], 10) || 1;
          } else {
            canonicalTallies[item.id].totalQuantity += 1;
          }
        }
      });

      // 2. Also split productsSummary by commas/lines to catch dynamic items not in catalog
      const tokens = summary.split(/[,;\n+]/).map((t) => t.trim()).filter(Boolean);
      tokens.forEach((rawToken) => {
        // Check if token was already covered by a canonical item
        const isCovered = KNOWN_CATALOG.some(
          (item) => matchedInOrder.has(item.id) && item.pattern.test(rawToken)
        );

        if (!isCovered && rawToken.length > 2) {
          // Clean token: strip leading quantity digits and packaging keywords
          const cleanName = rawToken
            .replace(/^\d+\s*(שקים|שקי|בלות|בלה|משטחי|משטח|לוחות|לוח|יח׳|יחידות|שק|משטחים)?\s*/i, '')
            .trim();

          if (cleanName.length > 2 && !/^(בסדר|סופק|דחוף|לתאם|הערה)/i.test(cleanName)) {
            // Extract quantity if present
            const qtyMatch = rawToken.match(/^(\d+)/);
            const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

            if (!dynamicUnmappedTallies[cleanName]) {
              dynamicUnmappedTallies[cleanName] = {
                rawName: cleanName,
                orderCount: 0,
                totalQuantity: 0,
                matchedOrderIds: new Set(),
                warehouse: order.warehouse.includes('החרש') ? 'מחסן 4 (החרש)' : 'מחסן 1 (התלמיד)',
              };
            }

            if (!dynamicUnmappedTallies[cleanName].matchedOrderIds.has(order.id)) {
              dynamicUnmappedTallies[cleanName].orderCount += 1;
              dynamicUnmappedTallies[cleanName].matchedOrderIds.add(order.id);
              dynamicUnmappedTallies[cleanName].totalQuantity += qty;
            }
          }
        }
      });
    });

    // Merge catalog results
    const combinedResults: TopProductItem[] = [];

    KNOWN_CATALOG.forEach((item) => {
      const stats = canonicalTallies[item.id];
      if (stats.orderCount > 0) {
        const percent = totalOrdersCount > 0
          ? Math.round((stats.orderCount / totalOrdersCount) * 100)
          : 0;

        combinedResults.push({
          id: item.id,
          name: item.name,
          shortName: item.shortName,
          category: item.category,
          orderCount: stats.orderCount,
          frequencyPercent: percent,
          totalQuantity: stats.totalQuantity,
          unit: item.unit,
          color: item.color,
          warehouse: item.warehouse,
          icon: item.icon,
          rank: 0, // Assigned after sort
        });
      }
    });

    // Merge dynamic tokens that appeared in at least 1 order
    Object.entries(dynamicUnmappedTallies).forEach(([name, stats], idx) => {
      if (stats.orderCount > 0) {
        const percent = totalOrdersCount > 0
          ? Math.round((stats.orderCount / totalOrdersCount) * 100)
          : 0;

        combinedResults.push({
          id: `dyn_${idx}`,
          name: stats.rawName,
          shortName: stats.rawName,
          category: 'שונות / מותאם',
          orderCount: stats.orderCount,
          frequencyPercent: percent,
          totalQuantity: stats.totalQuantity,
          unit: 'יח׳',
          color: '#64748b',
          warehouse: stats.warehouse,
          icon: '📦',
          rank: 0,
        });
      }
    });

    // Apply category filter if active
    let filtered = combinedResults;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Sort by chosen metric: Frequency (orderCount) or Total Quantity
    if (metricType === 'frequency') {
      filtered.sort((a, b) => b.orderCount - a.orderCount || b.totalQuantity - a.totalQuantity);
    } else {
      filtered.sort((a, b) => b.totalQuantity - a.totalQuantity || b.orderCount - a.orderCount);
    }

    // Assign final 1-based ranks
    return filtered.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [orders, warehouseFilter, selectedCategory, metricType, totalOrdersCount]);

  // Sliced data for Recharts display
  const chartData = useMemo(() => {
    return topProductsList.slice(0, displayLimit);
  }, [topProductsList, displayLimit]);

  // Unique categories for the filter pill list
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    topProductsList.forEach((p) => cats.add(p.category));
    return Array.from(cats);
  }, [topProductsList]);

  // Top 3 Podium Winners
  const topPodium = useMemo(() => {
    return topProductsList.slice(0, 3);
  }, [topProductsList]);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: TopProductItem = payload[0].payload;
      return (
        <div
          className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 text-xs min-w-[220px] font-sans text-right"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-700/60">
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-black text-slate-100 truncate text-xs">{item.name}</div>
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span>{item.category}</span>
                <span>•</span>
                <span>{item.warehouse}</span>
              </div>
            </div>
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-black text-white"
              style={{ backgroundColor: item.color }}
            >
              #{item.rank}
            </span>
          </div>

          {/* Stats */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-medium">שכיחות הופעה בהזמנות:</span>
              <strong className="text-white font-black text-xs">
                {item.orderCount} מתוך {totalOrdersCount} הזמנות
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="font-medium">אחוז מכלל ההזמנות בגיליון:</span>
              <strong className="text-emerald-400 font-black text-xs">
                {item.frequencyPercent}%
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="font-medium">סה״כ כמות מצטברת:</span>
              <strong className="text-blue-400 font-black text-xs">
                {item.totalQuantity} {item.unit}
              </strong>
            </div>

            {/* Progress bar inside tooltip */}
            <div className="pt-1">
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, item.frequencyPercent)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="top-products-recharts-card"
      className={`win-card rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5 bg-white ${className}`}
      dir="rtl"
    >
      {/* ========================================================================= */}
      {/* 1. COMPONENT HEADER & PRIMARY CONTROLS */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                המוצרים המובילים — שכיחות פריטים בגיליון
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>ניתוח שכיחות Recharts</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              שכיחות הופעת פריטים וביקושים מתוך שדות ה-productsSummary של כל {totalOrdersCount} ההזמנות בגיליון ח. סבן
            </p>
          </div>
        </div>

        {/* View Switchers & Granular Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Mode Toggle: Frequency vs Quantity */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex items-center">
            <button
              type="button"
              onClick={() => setMetricType('frequency')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metricType === 'frequency'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="שכיחות הופעת הפריט בכמות ההזמנות"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>שכיחות הופעה (הזמנות)</span>
            </button>

            <button
              type="button"
              onClick={() => setMetricType('quantity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metricType === 'quantity'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="כמות יחידות מצטברת מתוך פירוט ההזמנות"
            >
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
              <span>כמות יחידות מצטברת</span>
            </button>
          </div>

          {/* Orientation Toggle: Horizontal vs Vertical Bars */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex items-center">
            <button
              type="button"
              onClick={() => setOrientation('horizontal')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                orientation === 'horizontal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="עמודות אופקיות (שמות מוצרים מלאים)"
            >
              <BarChart3 className="w-3.5 h-3.5 rotate-90" />
              <span className="hidden sm:inline">אופקי</span>
            </button>
            <button
              type="button"
              onClick={() => setOrientation('vertical')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                orientation === 'vertical'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="עמודות עומדות"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">אנכי</span>
            </button>
          </div>

          {/* Top Limit Selector */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/80 flex items-center text-xs font-bold text-slate-700">
            {[5, 8, 12].map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => setDisplayLimit(limit)}
                className={`px-2.5 py-1.5 rounded-xl transition ${
                  displayLimit === limit
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                טופ {limit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECONDARY FILTER STRIP (WAREHOUSE & CATEGORIES) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-xs">
        {/* Warehouse Filter */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>סנן לפי סניף:</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWarehouseFilter('all')}
              className={`px-2.5 py-1 rounded-xl font-bold transition ${
                warehouseFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              כל המחסנים
            </button>
            <button
              type="button"
              onClick={() => setWarehouseFilter('wh4')}
              className={`px-2.5 py-1 rounded-xl font-bold transition ${
                warehouseFilter === 'wh4'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200/80'
              }`}
            >
              🏭 מחסן 4 (החרש)
            </button>
            <button
              type="button"
              onClick={() => setWarehouseFilter('wh1')}
              className={`px-2.5 py-1 rounded-xl font-bold transition ${
                warehouseFilter === 'wh1'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200/80'
              }`}
            >
              🏟️ מחסן 1 (התלמיד)
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>קטגוריה:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-xl font-bold transition ${
              selectedCategory === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            הכל ({topProductsList.length})
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-xl font-bold transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT: RECHARTS BAR CHART (LEFT/CENTER) + TOP PODIUM (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Recharts Bar Chart Container */}
        <div className="lg:col-span-8 bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 relative">
          {/* Subheader info inside chart container */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>
                {metricType === 'frequency'
                  ? `גרף עמודות — שכיחות הופעה (בכמה הזמנות מתוך ${totalOrdersCount} מופיע הפריט)`
                  : 'גרף עמודות — כמות יחידות כוללת שהוזמנה בכל הגיליון'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-bold">
              מוצגים טופ {chartData.length} מתוך {topProductsList.length} מוצרים
            </span>
          </div>

          {/* Empty state */}
          {chartData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <Boxes className="w-10 h-10 opacity-40" />
              <p className="text-xs font-bold text-slate-600">לא נמצאו פריטים תואמים לסינון הנבחר</p>
              <button
                type="button"
                onClick={() => {
                  setWarehouseFilter('all');
                  setSelectedCategory('all');
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                איפוס סינונים
              </button>
            </div>
          ) : orientation === 'horizontal' ? (
            /* ===================================================== */
            /* HORIZONTAL BARS (Vertical layout in Recharts)          */
            /* ===================================================== */
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 25, left: 15, bottom: 5 }}
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
                    dataKey="shortName"
                    width={130}
                    tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 700 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey={metricType === 'frequency' ? 'orderCount' : 'totalQuantity'}
                    name={metricType === 'frequency' ? 'הזמנות' : 'כמות'}
                    radius={[0, 6, 6, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`top-bar-h-${entry.id}-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* ===================================================== */
            /* VERTICAL BARS (Horizontal layout in Recharts)        */
            /* ===================================================== */
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 10, fill: '#334155', fontWeight: 700 }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                    height={40}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey={metricType === 'frequency' ? 'orderCount' : 'totalQuantity'}
                    name={metricType === 'frequency' ? 'הזמנות' : 'כמות'}
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`top-bar-v-${entry.id}-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart footer hint */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>רחף עם העכבר על כל עמודה לצפייה באחוז שכיחות, כמות מפורטת ומחסן ליבה</span>
            </span>
            <span className="font-mono text-amber-700 font-bold">
              Recharts Bar Engine
            </span>
          </div>
        </div>

        {/* Top Products Leaderboard / Podium Cards (Right Column) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <Award className="w-4 h-4 text-amber-500" />
              <span>דירוג המוצרים המובילים</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              שכיחות מתוך {totalOrdersCount} הזמנות
            </span>
          </div>

          {/* Top 3 Medals List */}
          <div className="space-y-2">
            {topPodium.map((product, idx) => {
              const medalEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
              const rankBadgeClass =
                idx === 0
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : idx === 1
                  ? 'bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-amber-50 text-amber-800 border-amber-200';

              return (
                <div
                  key={product.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{medalEmoji}</span>
                      <span className="text-base">{product.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate max-w-[130px]">
                          {product.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {product.category}
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-xs font-black text-slate-900">
                        {product.orderCount} הזמנות
                      </span>
                      <div className="text-[10px] font-extrabold text-emerald-600">
                        {product.frequencyPercent}% שכיחות
                      </div>
                    </div>
                  </div>

                  {/* Visual Frequency Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, product.frequencyPercent)}%`,
                        backgroundColor: product.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>{product.warehouse}</span>
                    <span className="font-extrabold text-slate-700">
                      סה״כ {product.totalQuantity} {product.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Summary Pill Stats */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-l from-amber-50/70 via-orange-50/40 to-white border border-amber-100 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">סה"כ פריטים שזוהו:</span>
              <span className="font-black text-slate-900">{topProductsList.length} פריטים</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">הפריט המבוקש ביותר:</span>
              <span className="font-black text-amber-800">
                {topPodium[0] ? `${topPodium[0].icon} ${topPodium[0].shortName}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">שיעור חדירה מוביל:</span>
              <span className="font-black text-emerald-700">
                {topPodium[0] ? `${topPodium[0].frequencyPercent}% מההזמנות` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
