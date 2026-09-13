import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Truck,
  Building2,
  Navigation,
  Sparkles,
  Copy,
  Check,
  Send,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Trash2,
  Share2,
  Smartphone,
  Route,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  Layers,
  X,
  RefreshCw,
} from 'lucide-react';
import { Order } from '../types';
import {
  RouteStop,
  BulkRouteData,
  WAREHOUSE_COORDINATES,
  ordersToRouteStops,
  optimizeRouteStops,
  generateGoogleMapsMultiStopUrl,
  generateCombinedWazeUrl,
  saveBulkRoute,
  generateDriverWhatsAppBroadcast,
} from '../lib/routeOptimizer';

interface BulkRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrders: Order[];
  allDayOrders: Order[];
  currentDate: string;
  defaultDriver?: string;
  onOpenDriverCompanion?: (route: BulkRouteData) => void;
}

export const BulkRouteModal: React.FC<BulkRouteModalProps> = ({
  isOpen,
  onClose,
  selectedOrders,
  allDayOrders,
  currentDate,
  defaultDriver = 'חכמת (מרצדס מנוף)',
  onOpenDriverCompanion,
}) => {
  // Active driver selection
  const [activeDriver, setActiveDriver] = useState<string>(defaultDriver);
  // Selected warehouse key
  const [warehouseKey, setWarehouseKey] = useState<'haresh' | 'talmid'>('haresh');
  // Current route stops in order
  const [stops, setStops] = useState<RouteStop[]>([]);
  // Optimizing animation state
  const [isOptimizing, setIsOptimizing] = useState(false);
  // Saved route state & short link
  const [generatedRoute, setGeneratedRoute] = useState<BulkRouteData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [isSavingRoute, setIsSavingRoute] = useState(false);

  // Initialize or re-filter stops when modal opens or driver changes
  useEffect(() => {
    if (!isOpen) return;

    // Filter relevant orders for this driver
    let candidateOrders = selectedOrders.filter((o) => o.driver.includes(activeDriver.includes('חכמת') ? 'חכמת' : 'עלי'));

    // If no orders were selected for this driver, default to all orders for this driver on the day
    if (candidateOrders.length === 0) {
      candidateOrders = allDayOrders.filter((o) => o.driver.includes(activeDriver.includes('חכמת') ? 'חכמת' : 'עלי'));
    }

    // Auto-detect dominant warehouse
    const hareshCount = candidateOrders.filter((o) => o.warehouse.includes('החרש') || o.warehouse.includes('4')).length;
    const talmidCount = candidateOrders.filter((o) => o.warehouse.includes('התלמיד') || o.warehouse.includes('1')).length;
    const initialWarehouseKey = talmidCount > hareshCount ? 'talmid' : 'haresh';
    setWarehouseKey(initialWarehouseKey);

    const converted = ordersToRouteStops(candidateOrders);
    setStops(converted);
    setGeneratedRoute(null);
  }, [isOpen, activeDriver, selectedOrders, allDayOrders]);

  if (!isOpen) return null;

  const currentWarehouse = WAREHOUSE_COORDINATES[warehouseKey];
  const driverShortName = activeDriver.includes('חכמת') ? 'חכמת' : 'עלי';
  const driverPhone = activeDriver.includes('חכמת') ? '0520000005' : '0520000006';

  // Run Smart Route Optimization
  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const optimized = optimizeRouteStops(stops, {
        lat: currentWarehouse.lat,
        lng: currentWarehouse.lng,
      });
      setStops(optimized);
      setGeneratedRoute(null);
      setIsOptimizing(false);
    }, 450);
  };

  // Move stop up in sequence
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...stops];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setStops(updated);
    setGeneratedRoute(null);
  };

  // Move stop down in sequence
  const handleMoveDown = (index: number) => {
    if (index === stops.length - 1) return;
    const updated = [...stops];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setStops(updated);
    setGeneratedRoute(null);
  };

  // Remove stop from this route
  const handleRemoveStop = (orderId: string) => {
    setStops(stops.filter((s) => s.orderId !== orderId));
    setGeneratedRoute(null);
  };

  // Generate / Save Route and Short Link
  const handleGenerateRoute = async () => {
    if (stops.length === 0) return;

    setIsSavingRoute(true);
    try {
      const googleMapsUrl = generateGoogleMapsMultiStopUrl(currentWarehouse.address, stops);
      const combinedWaze = generateCombinedWazeUrl(stops[0]);

      const routeData = await saveBulkRoute({
        id: `route-${Date.now()}`,
        code: '',
        driver: activeDriver,
        date: currentDate,
        originWarehouse: currentWarehouse,
        stops,
        totalStops: stops.length,
        combinedWazeUrl: combinedWaze,
        googleMapsMultiStopUrl: googleMapsUrl,
        createdAt: new Date().toISOString(),
      });

      setGeneratedRoute(routeData);
    } catch (err) {
      console.warn('Error saving route:', err);
    } finally {
      setIsSavingRoute(false);
    }
  };

  // Copy Shortened Link
  const handleCopyLink = () => {
    if (!generatedRoute) return;
    navigator.clipboard.writeText(generatedRoute.shortUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy WhatsApp broadcast text
  const handleCopyWhatsAppText = () => {
    if (!generatedRoute) return;
    const text = generateDriverWhatsAppBroadcast(generatedRoute);
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  // Direct WhatsApp dispatch URL
  const getWhatsAppSendUrl = () => {
    if (!generatedRoute) return '#';
    const text = generateDriverWhatsAppBroadcast(generatedRoute);
    return `https://api.whatsapp.com/send?phone=972${driverPhone.slice(1)}&text=${encodeURIComponent(text)}`;
  };

  // Calculate totals
  const totalBigBags = stops.reduce((acc, s) => {
    const match = s.depositsSummary.match(/(\d+)\s*בל/);
    return acc + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  const totalPallets = stops.reduce((acc, s) => {
    const match = s.depositsSummary.match(/(\d+)\s*משטח/);
    return acc + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-right">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-blue-50/70 via-white to-sky-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <Route className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  ניווט מרוכז ואופטימיזציית מסלול (Bulk Navigate)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Waze Multi-Stop
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                איחוד יעדי חלוקה לנהג, אופטימיזציית רצף נסיעה חכמה ומחולל לינק מקוצר לניווט
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="סגור חלון"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Driver & Warehouse Selector Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            {/* Driver Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>נהג ומשאית לחלוקה:</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDriver('חכמת (מרצדס מנוף)')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 ${
                    activeDriver.includes('חכמת')
                      ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🏗️ חכמת (מרצדס מנוף)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDriver('עלי (משאית איסוזו)')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 ${
                    activeDriver.includes('עלי')
                      ? 'bg-sky-50 text-sky-900 border-sky-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🚚 עלי (משאית איסוזו)</span>
                </button>
              </div>
            </div>

            {/* Warehouse Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>מחסן מוצא וטעינה:</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWarehouseKey('haresh')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 text-right ${
                    warehouseKey === 'haresh'
                      ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🏭 מחסן 4 (החרש 8)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWarehouseKey('talmid')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 text-right ${
                    warehouseKey === 'talmid'
                      ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🏟️ מחסן 1 (התלמיד 3)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Route Summary & Optimization Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>תחנות במסלול: {stops.length}</span>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                סה"כ פקדונות:{' '}
                <strong className="text-slate-800">
                  {totalBigBags > 0 ? `${totalBigBags} בלות` : ''}{' '}
                  {totalPallets > 0 ? `${totalPallets} משטחים` : ''}
                  {totalBigBags === 0 && totalPallets === 0 ? 'פטור' : ''}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOptimize}
                disabled={stops.length <= 1 || isOptimizing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
                title="סידור תחנות אוטומטי מחושב ממרחק מחסן המוצא"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isOptimizing ? 'animate-spin' : ''}`} />
                <span>{isOptimizing ? 'ממטב מסלול...' : 'מטב מסלול חכם ⚡'}</span>
              </button>

              {!generatedRoute && (
                <button
                  type="button"
                  onClick={handleGenerateRoute}
                  disabled={stops.length === 0 || isSavingRoute}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isSavingRoute ? 'מייצר לינק...' : 'הפק לינק מקוצר ו-Waze'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Stops Sequence List */}
          {stops.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700">לא נבחרו הזמנות עבור {activeDriver}</p>
              <p className="text-xs text-slate-500">
                סמן הזמנות בלוח הסידור עבור נהג זה או בחר נהג אחר למעלה
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === stops.length - 1;
                const stopNumber = index + 1;

                return (
                  <div
                    key={stop.orderId}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 transition shadow-2xs flex items-center justify-between gap-3 text-xs"
                  >
                    {/* Number Badge & Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black flex-shrink-0">
                        {stopNumber}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 truncate">
                            {stop.clientName}
                          </span>
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-bold border border-blue-100">
                            #{stop.orderNumber}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {stop.roundAndTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{stop.destinationAddress}</span>
                            <span className="text-slate-400">({stop.city})</span>
                          </span>
                          <span>•</span>
                          <span className="text-slate-500 truncate max-w-[220px]">
                            {stop.productsSummary}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Reordering */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Direct Waze for this stop */}
                      <a
                        href={stop.wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] border border-sky-200 flex items-center gap-1 transition"
                        title="נווט ישירות בוויז לתחנה זו"
                      >
                        <Navigation className="w-3 h-3 text-sky-600" />
                        <span>Waze</span>
                      </a>

                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={isFirst}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition"
                        title="העלה תחנה אחת למעלה"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={isLast}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition"
                        title="הורד תחנה אחת למטה"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Remove Stop */}
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(stop.orderId)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="הסר תחנה ממסלול זה"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generated Combined Route & Short Link Section */}
          {generatedRoute && (
            <div className="p-4 rounded-2xl bg-gradient-to-bl from-emerald-50/80 via-white to-sky-50/60 border-2 border-emerald-300 shadow-md space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      מסלול הניווט המרוכז מוכן לשידור! 🚀
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      נוצר לינק מקוצר ייחודי המאפשר לנהג לפתוח Waze לכל תחנה ברצף או לנווט ישירות
                    </p>
                  </div>
                </div>

                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                  קוד: {generatedRoute.code}
                </span>
              </div>

              {/* Short Link Display Box */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400 font-bold text-xs flex-shrink-0">לינק מקוצר:</span>
                  <span className="font-mono text-xs text-blue-700 font-black truncate bg-blue-50/70 px-2 py-1 rounded-md select-all">
                    {generatedRoute.shortUrl}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">הועתק! ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>העתק לינק מקוצר</span>
                      </>
                    )}
                  </button>

                  <a
                    href={generatedRoute.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                    title="בדוק קישור בחלון חדש"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Action Buttons: WhatsApp & Driver Companion */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Send via WhatsApp */}
                <a
                  href={getWhatsAppSendUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm shadow-emerald-600/30 transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>שדר מסלול בוואטסאפ ל{driverShortName} ({stops.length} תחנות) 📲</span>
                </a>

                {/* Copy WhatsApp text */}
                <button
                  type="button"
                  onClick={handleCopyWhatsAppText}
                  className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition active:scale-95 flex items-center gap-1.5"
                  title="העתק את טקסט ההודעה המלא עם הלינקים"
                >
                  {copiedWhatsApp ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>הועתק! ✅</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>העתק טקסט</span>
                    </>
                  )}
                </button>

                {/* Google Maps Multi-Stop Full Route */}
                <a
                  href={generatedRoute.googleMapsMultiStopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs transition active:scale-95"
                  title="פתח מסלול מרוכז במפות גוגל עם כל התחנות ברצף"
                >
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>מפות גוגל (Multi-Stop)</span>
                </a>

                {/* Launch Driver Interactive Companion */}
                {onOpenDriverCompanion && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDriverCompanion(generatedRoute);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>תצוגת מסלול לנהג 📱</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {stops.length} הזמנות נבחרו לחלוקה עבור {activeDriver}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-white transition"
            >
              סגור
            </button>

            {!generatedRoute ? (
              <button
                type="button"
                onClick={handleGenerateRoute}
                disabled={stops.length === 0 || isSavingRoute}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm shadow-blue-600/30 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Route className="w-4 h-4" />
                <span>צור מסלול ולינק מקוצר 🗺️</span>
              </button>
            ) : (
              <a
                href={generatedRoute.combinedWazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-sm shadow-sky-600/30 transition active:scale-95 flex items-center gap-1.5"
              >
                <Navigation className="w-4 h-4 text-white" />
                <span>הפעל Waze לתחנה ראשונה 🚗</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
