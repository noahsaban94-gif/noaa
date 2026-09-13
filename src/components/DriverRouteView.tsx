import React, { useState, useEffect } from 'react';
import {
  Navigation,
  CheckCircle2,
  Phone,
  MapPin,
  Package,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Truck,
  RotateCcw,
  CheckSquare,
  Square,
  Clock,
  Building2,
  Award,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import { BulkRouteData, RouteStop, getBulkRouteByCode } from '../lib/routeOptimizer';

interface DriverRouteViewProps {
  routeData?: BulkRouteData | null;
  routeCode?: string;
  onBackToMain: () => void;
  onUpdateOrderStatus?: (orderId: string, status: any) => void;
}

export const DriverRouteView: React.FC<DriverRouteViewProps> = ({
  routeData: initialRoute,
  routeCode,
  onBackToMain,
  onUpdateOrderStatus,
}) => {
  const [route, setRoute] = useState<BulkRouteData | null>(initialRoute || null);
  const [loading, setLoading] = useState<boolean>(!initialRoute && !!routeCode);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const [completedStops, setCompletedStops] = useState<Record<string, boolean>>({});
  const [checkedProducts, setCheckedProducts] = useState<Record<string, boolean>>({});

  // Load route if given a code
  useEffect(() => {
    if (initialRoute) {
      setRoute(initialRoute);
      return;
    }

    if (routeCode) {
      setLoading(true);
      getBulkRouteByCode(routeCode).then((loaded) => {
        if (loaded) {
          setRoute(loaded);
          // Initialize completed status
          const initialCompleted: Record<string, boolean> = {};
          loaded.stops.forEach((s) => {
            if (s.completed || s.status === 'נמסר באתר') {
              initialCompleted[s.orderId] = true;
            }
          });
          setCompletedStops(initialCompleted);
        }
        setLoading(false);
      });
    }
  }, [initialRoute, routeCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center animate-bounce mb-4 shadow-xl shadow-blue-500/30">
          <Truck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-black">טוען את מסלול הנסיעה...</h2>
        <p className="text-sm text-slate-400 mt-1">נועה AI מכינה עבורך את תחנות הפריקה והניווט</p>
      </div>
    );
  }

  if (!route || !route.stops || route.stops.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-black">מסלול הנסיעה לא נמצא</h2>
        <p className="text-sm text-slate-400 mt-1">קוד המסלול אינו תקף או שפג תוקפו.</p>
        <button
          onClick={onBackToMain}
          className="mt-6 px-6 py-2.5 rounded-2xl bg-blue-600 font-bold text-white shadow-lg active:scale-95 transition"
        >
          חזור למסך הראשי
        </button>
      </div>
    );
  }

  const currentStop: RouteStop = route.stops[currentStopIndex] || route.stops[0];
  const isCurrentCompleted = !!completedStops[currentStop.orderId];
  const completedCount = Object.values(completedStops).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / route.stops.length) * 100);
  const isAllCompleted = completedCount === route.stops.length;

  const handleToggleComplete = (orderId: string) => {
    const newState = !completedStops[orderId];
    setCompletedStops((prev) => ({ ...prev, [orderId]: newState }));

    if (onUpdateOrderStatus && newState) {
      onUpdateOrderStatus(orderId, 'נמסר באתר');
    }

    // Auto advance to next uncompleted stop if marking completed
    if (newState && currentStopIndex < route.stops.length - 1) {
      setCurrentStopIndex((prev) => prev + 1);
    }
  };

  const handleToggleProduct = (key: string) => {
    setCheckedProducts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const driverShortName = route.driver.includes('חכמת') ? 'חכמת' : 'עלי';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 selection:bg-blue-600" dir="rtl">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToMain}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="חזור לסידור עבודה"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">
                  {route.driver.includes('חכמת') ? '🏗️ חכמת' : '🚚 עלי'} — מסלול נסיעה
                </span>
                <span className="font-mono text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/50">
                  #{route.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {route.date} • {route.stops.length} תחנות פריקה
              </p>
            </div>
          </div>

          <div className="text-left">
            <span className="text-xs font-black text-emerald-400">
              {completedCount} / {route.stops.length} נמסרו
            </span>
            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
        {/* All Delivered Celebration Banner */}
        {isAllCompleted && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl flex items-center gap-3 animate-in zoom-in">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Award className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black">כל הכבוד, {driverShortName}! 🏆</h3>
              <p className="text-xs text-emerald-100">
                כל {route.stops.length} התחנות נמסרו ונפרקו בהצלחה באתרים.
              </p>
            </div>
          </div>
        )}

        {/* Station Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {route.stops.map((stop, idx) => {
            const isCompleted = !!completedStops[stop.orderId];
            const isCurrent = idx === currentStopIndex;

            return (
              <button
                key={stop.orderId}
                onClick={() => setCurrentStopIndex(idx)}
                className={`flex-shrink-0 px-3 py-2 rounded-2xl font-black text-xs border transition flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                    : isCompleted
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <span>תחנה {idx + 1}</span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Current Active Station Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          {/* Card Top Strip */}
          <div className="p-4.5 bg-gradient-to-l from-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {currentStopIndex + 1}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400">תחנה {currentStopIndex + 1} מתוך {route.stops.length}</span>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{currentStop.clientName}</h3>
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                    #{currentStop.orderNumber}
                  </span>
                </div>
              </div>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              {currentStop.roundAndTime}
            </span>
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-4">
            {/* Primary Action: Big Waze Button */}
            <a
              href={currentStop.wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-base shadow-lg shadow-sky-500/25 flex items-center justify-center gap-3 transition active:scale-98"
            >
              <Navigation className="w-6 h-6 fill-current" />
              <span>נווט בוויז 🚗 Waze לתחנה זו</span>
            </a>

            {/* Destination Address & Call Customer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Address */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>כתובת היעד לפריקה:</span>
                </span>
                <p className="text-sm font-bold text-white">
                  {currentStop.destinationAddress}
                </p>
                <span className="text-xs text-sky-300 font-semibold">{currentStop.city}</span>
              </div>

              {/* Client Contact */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>איש קשר באתר:</span>
                  </span>
                  <p className="text-sm font-bold text-white mt-1">
                    {currentStop.clientPhone || '052-0000000'}
                  </p>
                </div>

                <a
                  href={`tel:${currentStop.clientPhone || '0520000000'}`}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition"
                  title="חייג ללקוח"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Cargo / Products to Unload */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                <span>פריטים לפריקה באתר:</span>
              </span>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-200 leading-relaxed">
                {currentStop.productsSummary}
              </div>

              {/* Deposits to Collect/Verify */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-bold">פקדונות נדרשים (בלות / משטחים):</span>
                <span className="font-bold text-teal-300 bg-teal-950/70 border border-teal-800 px-2 py-0.5 rounded-lg">
                  {currentStop.depositsSummary}
                </span>
              </div>
            </div>

            {/* Stop Notes if present */}
            {currentStop.notes && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-medium">
                💡 הנחיית סדרן: {currentStop.notes}
              </div>
            )}

            {/* Delivery Completion Toggle */}
            <button
              onClick={() => handleToggleComplete(currentStop.orderId)}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 active:scale-98 ${
                isCurrentCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 ${isCurrentCompleted ? 'text-white' : 'text-slate-400'}`} />
              <span>
                {isCurrentCompleted ? 'נמסר באתר בהצלחה! (לחץ לביטול)' : 'סמן כנמסר באתר ✓ ועבור לתחנה הבאה'}
              </span>
            </button>
          </div>

          {/* Prev / Next Station Controls */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
            <button
              onClick={() => setCurrentStopIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStopIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
              <span>תחנה קודמת</span>
            </button>

            <span>
              {currentStopIndex + 1} / {route.stops.length}
            </span>

            <button
              onClick={() => setCurrentStopIndex((prev) => Math.min(route.stops.length - 1, prev + 1))}
              disabled={currentStopIndex === route.stops.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
            >
              <span>תחנה הבאה</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full Itinerary List */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-black text-slate-400 px-1">כל תחנות המסלול ברצף:</h4>
          {route.stops.map((stop, idx) => {
            const isCompleted = !!completedStops[stop.orderId];
            const isCurrent = idx === currentStopIndex;

            return (
              <div
                key={stop.orderId}
                onClick={() => setCurrentStopIndex(idx)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 text-xs ${
                  isCurrent
                    ? 'bg-slate-850 border-blue-500'
                    : isCompleted
                    ? 'bg-slate-900/60 border-slate-800/80 opacity-60'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] ${
                      isCompleted
                        ? 'bg-emerald-900 text-emerald-300'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{stop.clientName}</span>
                      <span className="text-[10px] text-slate-400">({stop.city})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{stop.destinationAddress}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={stop.wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-300 border border-sky-700/50 transition"
                    title="נווט בוויז לתחנה זו"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
