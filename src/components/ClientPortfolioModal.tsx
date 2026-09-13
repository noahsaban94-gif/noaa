import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Building2,
  Phone,
  FolderOpen,
  FileText,
  Calendar,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  MapPin,
  Navigation,
  Share2,
  Printer,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  UploadCloud,
  FileCheck,
  Image,
  Layers,
  ArrowUpRight,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';
import { Client, Order, OrderStatus } from '../types';
import { checkBelaDepositAlert } from '../utils/orderValidation';

interface ClientPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  orders: Order[];
  onOpenNewOrderForClient: (client: Client) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
}

type TabType = 'sheet_orders' | 'drive_files' | 'deposits_ledger' | 'crm_profile';

export const ClientPortfolioModal: React.FC<ClientPortfolioModalProps> = ({
  isOpen,
  onClose,
  client,
  orders,
  onOpenNewOrderForClient,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('sheet_orders');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'delivered' | 'active' | 'crane' | 'isuzu'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState(false);
  const [isScanningSheet, setIsScanningSheet] = useState(true);

  // Trigger smooth simulated real-time sheet scan whenever modal opens or client changes
  useEffect(() => {
    if (isOpen && client) {
      setIsScanningSheet(true);
      const timer = setTimeout(() => {
        setIsScanningSheet(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, client?.id]);

  const handleRescanSheet = () => {
    setIsScanningSheet(true);
    setTimeout(() => {
      setIsScanningSheet(false);
    }, 400);
  };

  // Cross-reference & scan orders from Google Sheet / system matching this client
  const clientOrders = useMemo(() => {
    if (!client) return [];
    const clientNameLower = client.name.toLowerCase().trim();
    // Normalize clean name components for fuzzy matching
    const nameKeywords = clientNameLower
      .replace(/[\/\-\(\)\"]/g, ' ')
      .split(' ')
      .filter((w) => w.length > 2);

    return orders.filter((order) => {
      const orderClient = (order.clientName || '').toLowerCase().trim();
      if (orderClient === clientNameLower) return true;
      if (orderClient.includes(clientNameLower) || clientNameLower.includes(orderClient)) return true;
      // Match by significant keywords
      return nameKeywords.some((kw) => orderClient.includes(kw));
    });
  }, [client, orders]);

  // Operational metrics from cross-referencing
  const metrics = useMemo(() => {
    const total = clientOrders.length;
    const delivered = clientOrders.filter((o) => o.status === 'נמסר באתר').length;
    const inProgress = clientOrders.filter((o) => o.status !== 'נמסר באתר').length;
    const craneCount = clientOrders.filter((o) => o.driver.includes('חכמת') || o.notes?.includes('מנוף')).length;
    const isuzuCount = clientOrders.filter((o) => o.driver.includes('עלי')).length;

    // Calculate deposits from summary text
    let bigBags = 0;
    let woodPallets = 0;
    clientOrders.forEach((o) => {
      const summary = o.depositsSummary || '';
      const bMatch = summary.match(/(\d+)\s*(?:בלות|בלה)/);
      if (bMatch) bigBags += parseInt(bMatch[1], 10);
      const pMatch = summary.match(/(\d+)\s*(?:משטחי|משטח)/);
      if (pMatch) woodPallets += parseInt(pMatch[1], 10);
    });

    return {
      total,
      delivered,
      inProgress,
      craneCount,
      isuzuCount,
      bigBags,
      woodPallets,
    };
  }, [clientOrders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return clientOrders.filter((o) => {
      if (orderFilter === 'delivered' && o.status !== 'נמסר באתר') return false;
      if (orderFilter === 'active' && o.status === 'נמסר באתר') return false;
      if (orderFilter === 'crane' && !o.driver.includes('חכמת')) return false;
      if (orderFilter === 'isuzu' && !o.driver.includes('עלי')) return false;

      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.destinationAddress.toLowerCase().includes(q) ||
          o.productsSummary.toLowerCase().includes(q) ||
          o.roundAndTime.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [clientOrders, orderFilter, orderSearch]);

  // Simulated digital files and delivery notes in Drive folder
  const driveDocuments = useMemo(() => {
    if (!client) return [];
    const docs = clientOrders.map((o, idx) => ({
      id: `doc-${o.orderNumber}`,
      title: `תעודת משלוח דיגיטלית חתומה #${o.orderNumber}`,
      filename: `POD_DELIVERY_${o.orderNumber}_SIGNED.pdf`,
      type: 'delivery_note' as const,
      orderNumber: o.orderNumber,
      date: o.date || '2026-09-13',
      signedBy: o.status === 'נמסר באתר' ? `${client.contactPerson || 'מנהל אתר'} (חתימת מסך)` : 'ממתין לפריקה',
      status: o.status === 'נמסר באתר' ? 'חתום ומאושר' : 'טיוטת תעודה',
      warehouse: o.warehouse,
      driver: o.driver,
      size: '248 KB',
      products: o.productsSummary,
    }));

    // Add general client files
    const generalFiles = [
      {
        id: `comax-${client.comaxId || 'master'}`,
        title: `כרטיס לקוח הנהלת חשבונות Comax ERP (#${client.comaxId || '607145'})`,
        filename: `COMAX_CLIENT_CARD_${client.comaxId || '607145'}.pdf`,
        type: 'comax' as const,
        orderNumber: 'קבוע',
        date: '01/01/2026',
        signedBy: 'ח. סבן הנהלת חשבונות',
        status: 'תקין / אובליגו מאושר',
        warehouse: 'משרד ראשי - החרש 4',
        driver: 'הסכם מסגרת',
        size: '1.2 MB',
        products: 'תנאי תשלום שוטף+60, ריכוז אספקות חודשי',
      },
      {
        id: `photo-site-${client.id}`,
        title: `תיעוד תצלום פריקת מנוף - ${client.address || 'אתר הלקוח'}`,
        filename: `SITE_UNLOAD_CRANE_PROOF.jpg`,
        type: 'photo' as const,
        orderNumber: clientOrders[0]?.orderNumber || '6215101',
        date: clientOrders[0]?.date || '2026-09-13',
        signedBy: 'חכמת (מרצדס מנוף)',
        status: 'תיעוד צילומי מאושר',
        warehouse: client.defaultWarehouse || 'מחסן 4',
        driver: 'חכמת',
        size: '2.4 MB',
        products: 'צילום פריקת 3 בלות חול וסומסום בחצר האתר',
      },
      {
        id: `deposit-reconcile-${client.id}`,
        title: `דוח מעקב והחזרת פקדונות (בלות ומשטחי עץ סבן)`,
        filename: `DEPOSIT_RECONCILE_LEDGER.pdf`,
        type: 'deposit' as const,
        orderNumber: 'מאזן',
        date: '13/09/2026',
        signedBy: 'נועה AI סדרנית',
        status: 'מעודכן מהגיליון',
        warehouse: 'מחסן 4 (החרש)',
        driver: 'סידור עבודה',
        size: '180 KB',
        products: `מאזן: ${metrics.bigBags} בלות (60002) • ${metrics.woodPallets} משטחי עץ (60060)`,
      },
    ];

    return [...docs, ...generalFiles];
  }, [client, clientOrders, metrics]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSimulatedUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccessToast(true);
      setTimeout(() => setUploadSuccessToast(false), 3000);
    }, 1200);
  };

  const driveUrl = client?.driveFolderUrl || 'https://drive.google.com/drive/folders/1YAevLPp-douFJe7qpyvLevhsGUX45Mz1';

  return (
    <AnimatePresence>
      {isOpen && client && (
        <motion.div
          key="portfolio-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm text-right"
          dir="rtl"
          onClick={onClose}
        >
          <motion.div
            key="portfolio-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar */}
            <div className="px-5 py-4 win-mica border-b border-slate-200/90 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white">
                    {client.name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="תיק לקוח פעיל" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-black text-slate-900">{client.name}</h1>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                      תיק לקוח CRM • ח. סבן
                    </span>
                    {client.comaxId && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        Comax: #{client.comaxId}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                    {client.contactPerson && (
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">איש קשר:</span>
                        <strong className="text-slate-700">{client.contactPerson}</strong>
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <strong className="text-slate-700">{client.phone}</strong>
                    </span>
                    {client.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{client.address || client.city}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Quick Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${client.phone}`}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition"
                  title={`חיוג מהיר ל${client.phone}`}
                >
                  <Phone className="w-4 h-4" />
                </a>

                <a
                  href={`https://wa.me/972${client.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=${encodeURIComponent(
                    `שלום ${client.name}, מדברים מסדרנות ח. סבן חומרי בניין (1994) בע"מ לגבי סידור העבודה.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                  title="שליחת הודעת וואטסאפ ללקוח"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition"
                  title="פתח תיקיית לקוח ב-Google Drive"
                >
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  <span>תיקיית Drive</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>

                <button
                  onClick={() => {
                    onClose();
                    onOpenNewOrderForClient(client);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>הזמנה חדשה</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="סגור"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Sheet Cross-Reference & Scan Banner */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 px-5 py-2.5 border-b border-blue-100/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {isScanningSheet ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span className="font-bold text-blue-800">
                      סורק ומצליב רשומות מגיליון Google Sheets...
                    </span>
                    <span className="text-[11px] text-blue-600/80 font-medium hidden sm:inline">
                      סריקה חיה של סידור העבודה ותעודות המשלוח
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold text-slate-800">
                      הצלבה וסריקה בזמן אמת מגיליון Google Sheets:
                    </span>
                    <span className="text-slate-600">
                      אותרו <strong className="text-blue-700 font-extrabold">{metrics.total}</strong> הזמנות ותעודות מקושרות בסידור העבודה
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 font-semibold text-slate-700">
                <button
                  onClick={handleRescanSheet}
                  disabled={isScanningSheet}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold transition shadow-2xs active:scale-95 disabled:opacity-60"
                  title="רענן הצלבת נתונים מול Google Sheets"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanningSheet ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                  <span>{isScanningSheet ? 'סורק...' : 'רענן מול גיליון'}</span>
                </button>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-emerald-800">
                  ✓ {metrics.delivered} נמסרו באתר
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-800">
                  ⏳ {metrics.inProgress} פעילות
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-amber-800 hidden sm:inline-block">
                  ⚖️ {metrics.bigBags} בלות • {metrics.woodPallets} משטחים
                </span>
              </div>
            </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-slate-200 bg-white flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setActiveTab('sheet_orders')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'sheet_orders'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>הזמנות ותעודות מהגיליון ({metrics.total})</span>
            </button>

            <button
              onClick={() => setActiveTab('drive_files')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'drive_files'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-amber-500" />
              <span>קבצים ותעודות בתיקיית Drive ({driveDocuments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('deposits_ledger')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'deposits_ledger'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>מאזן פקדונות וציוד</span>
            </button>

            <button
              onClick={() => setActiveTab('crm_profile')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'crm_profile'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>פרופיל קומקס ואתרי פרויקטים</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>ח. סבן 1994 בע"מ • סדרנות חכמה</span>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* TAB 1: SHEET ORDERS & DELIVERY NOTES */}
              {activeTab === 'sheet_orders' && (
                <div className="space-y-4">
                  {/* Search & Filter Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500">סינון:</span>
                      <button
                        onClick={() => setOrderFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          orderFilter === 'all'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        הכל ({metrics.total})
                      </button>
                      <button
                        onClick={() => setOrderFilter('delivered')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          orderFilter === 'delivered'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        נמסרו ({metrics.delivered})
                      </button>
                      <button
                        onClick={() => setOrderFilter('active')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          orderFilter === 'active'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        פעילות ({metrics.inProgress})
                      </button>
                      <button
                        onClick={() => setOrderFilter('crane')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          orderFilter === 'crane'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        מנוף חכמת ({metrics.craneCount})
                      </button>
                      <button
                        onClick={() => setOrderFilter('isuzu')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          orderFilter === 'isuzu'
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        איסוזו עלי ({metrics.isuzuCount})
                      </button>
                    </div>

                    <div className="w-full sm:w-64 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="חיפוש לפי תעודה, מוצר, כתובת..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Orders List / Loading Skeletons */}
                  {isScanningSheet ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={`skeleton-${n}`}
                          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3 animate-pulse text-right"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="h-5 w-28 bg-slate-200/80 rounded-lg"></div>
                            <div className="h-5 w-20 bg-slate-200/80 rounded-full"></div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-4 w-3/4 bg-slate-200/80 rounded"></div>
                            <div className="h-3 w-1/2 bg-slate-200/60 rounded"></div>
                          </div>
                          <div className="flex gap-2">
                            <div className="h-5 w-20 bg-slate-200/70 rounded-md"></div>
                            <div className="h-5 w-24 bg-slate-200/70 rounded-md"></div>
                          </div>
                          <div className="h-12 bg-slate-100/90 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-sm text-slate-700">לא נמצאו הזמנות תואמות לסינון</p>
                      <p className="text-xs text-slate-400 mt-1">
                        תוכל להוסיף הזמנה חדשה בסידור העבודה ישירות עבור {client.name}.
                      </p>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenNewOrderForClient(client);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>צור הזמנה לקבלן עכשיו</span>
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {filteredOrders.map((order, idx) => {
                        const isDelivered = order.status === 'נמסר באתר';
                        const isCrane = order.driver.includes('חכמת');
                        const belaAlert = checkBelaDepositAlert(order);

                        return (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.24,
                              delay: Math.min(idx * 0.04, 0.28),
                              ease: 'easeOut',
                            }}
                            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between text-right"
                          >
                            <div>
                              {/* Card Top: Order Number, Date, Status */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                    תעודה #{order.orderNumber}
                                  </span>
                                  <span className="text-xs text-slate-500 font-medium">
                                    {order.roundAndTime}
                                  </span>
                                </div>

                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    isDelivered
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : order.status === 'מוכן להעמסה'
                                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>

                              {/* Red Alert Badge for missing bags deposit / pallet threshold */}
                              {belaAlert.hasAlert && (
                                <div
                                  className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 text-right flex items-start gap-2 shadow-2xs"
                                  title={belaAlert.reason}
                                >
                                  <span className="p-1 rounded-md bg-red-600 text-white shrink-0 mt-0.5 animate-pulse">
                                    <AlertOctagon className="w-3.5 h-3.5" />
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-black text-red-900">
                                        התראת חיוב: בלות ללא פיקדון!
                                      </span>
                                      <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-red-600 text-white">
                                        {belaAlert.isExempt ? 'מסומן פטור' : 'ללא פיקדון'}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-red-700 mt-0.5 font-medium leading-snug">
                                      מניעת טעויות חיוב / סף משטח: ההזמנה כוללת בלות אך שדה הפיקדונות מסומן כפטור או ריק.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Destination & Waze */}
                              <div className="mt-2.5 flex items-start justify-between gap-2">
                                <div className="flex items-start gap-1.5 text-xs text-slate-700">
                                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                  <span className="font-semibold">{order.destinationAddress}</span>
                                </div>

                                <a
                                  href={order.wazeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded-md transition"
                                  title="ניווט בוויז"
                                >
                                  <Navigation className="w-3 h-3" />
                                  <span>Waze</span>
                                </a>
                              </div>

                              {/* Warehouse & Driver */}
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                  {order.warehouse}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                    isCrane
                                      ? 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                                      : 'bg-sky-50 text-sky-800 border border-sky-100'
                                  }`}
                                >
                                  {order.driver}
                                </span>
                              </div>

                              {/* Products Summary */}
                              <div className="mt-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                                <span className="text-slate-400 font-bold text-[10px] block mb-1">
                                  פירוט מוצרים בתעודה:
                                </span>
                                <p className="text-slate-800 font-medium leading-relaxed">
                                  {order.productsSummary}
                                </p>
                              </div>

                              {/* Deposits Summary */}
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">פקדונות נלווים:</span>
                                <div className="flex items-center gap-1.5">
                                  {belaAlert.hasAlert && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[10px] shadow-2xs animate-pulse"
                                      title={belaAlert.reason}
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      <span>חסר פיקדון!</span>
                                    </span>
                                  )}
                                  <span
                                    className={`font-bold px-2 py-0.5 rounded-md text-xs ${
                                      belaAlert.hasAlert
                                        ? 'bg-red-100 text-red-800 border border-red-300'
                                        : 'text-slate-800 bg-slate-100'
                                    }`}
                                  >
                                    {order.depositsSummary || 'פטור'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Actions */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                              <button
                                onClick={() =>
                                  setPreviewDoc({
                                    title: `תעודת משלוח #${order.orderNumber}`,
                                    order,
                                    client,
                                  })
                                }
                                className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-bold transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>תצוגה מקדימה</span>
                              </button>

                              <button
                                onClick={() =>
                                  handleCopy(
                                    `ח. סבן תעודת משלוח #${order.orderNumber} לקוח ${order.clientName} יעד: ${order.destinationAddress} נהג: ${order.driver} מוצרים: ${order.productsSummary}`,
                                    `ord-${order.orderNumber}`
                                  )
                                }
                                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition"
                              >
                                {copiedText === `ord-${order.orderNumber}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">הועתק!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>העתק פרטים</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              )}

          {/* TAB 2: DRIVE FILES & DOCUMENTS */}
          {activeTab === 'drive_files' && (
            <div className="space-y-4">
              {/* Google Drive Header Status Card */}
              <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        תיקיית לקוח מאובטחת Google Drive
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        סונכרנה כעת
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Google Drive / ח. סבן 1994 / לקוחות / {client.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulatedUpload}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isUploading ? 'מעלה מסמך...' : 'העלאת מסמך'}</span>
                  </button>

                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>פתח ב-Drive</span>
                  </a>
                </div>
              </div>

              {uploadSuccessToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>המסמך הועלה וסונכרן בהצלחה לתיקיית הלקוח ב-Google Drive!</span>
                </div>
              )}

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {driveDocuments.map((doc) => {
                  const isPdf = doc.filename.endsWith('.pdf');
                  const isJpg = doc.filename.endsWith('.jpg');

                  return (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between text-right"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isPdf
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : isJpg
                                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                  : 'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}
                            >
                              {isPdf ? (
                                <FileText className="w-5 h-5" />
                              ) : isJpg ? (
                                <Image className="w-5 h-5" />
                              ) : (
                                <FileCheck className="w-5 h-5" />
                              )}
                            </div>

                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                                {doc.title}
                              </h4>
                              <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                                {doc.filename} • {doc.size}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold shrink-0">
                            {doc.status}
                          </span>
                        </div>

                        <div className="mt-3 p-2 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">תאריך מסמך:</span>
                            <span className="font-bold text-slate-700">{doc.date}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">גורם חותם / מאשר:</span>
                            <span className="font-bold text-slate-700">{doc.signedBy}</span>
                          </div>
                          {doc.products && (
                            <div className="pt-1 text-[11px] text-slate-600 border-t border-slate-200/50">
                              <span className="text-slate-400">תוכן: </span>
                              <span>{doc.products}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* File Card Actions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          onClick={() =>
                            setPreviewDoc({
                              title: doc.title,
                              filename: doc.filename,
                              rawDoc: doc,
                              client,
                            })
                          }
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>הצג מסמך</span>
                        </button>

                        <a
                          href={driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>הורד מקובץ Drive</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DEPOSITS & EQUIPMENT LEDGER */}
          {activeTab === 'deposits_ledger' && (
            <div className="space-y-4">
              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>מאזן בלות חול וסומסום (מק"ט 60002)</span>
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{metrics.bigBags}</span>
                    <span className="text-xs text-slate-400">בלות פעילות באתרי הלקוח</span>
                  </div>
                  <span className="text-[11px] text-blue-700 font-semibold mt-1 block">
                    שווי פקדון משוער: ₪{metrics.bigBags * 35}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>מאזן משטחי עץ סבן (מק"ט 60060)</span>
                    <Layers className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{metrics.woodPallets}</span>
                    <span className="text-xs text-slate-400">משטחים מוחזקים</span>
                  </div>
                  <span className="text-[11px] text-amber-800 font-semibold mt-1 block">
                    שווי פקדון משוער: ₪{metrics.woodPallets * 45}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>סטטוס התחשבנות קומקס</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-base font-black text-emerald-700">מאזן פעיל מבוטח</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                    חיוב אוטומטי בהזמנה • זיכוי בהחזרת ציוד למחסן
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown per Order */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <h4 className="text-xs font-extrabold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>פירוט פקדונות לפי תעודות משלוח מהגיליון</span>
                </h4>

                <div className="divide-y divide-slate-100 text-xs">
                  {clientOrders.map((o) => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-blue-700">#{o.orderNumber}</strong>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-700 font-medium">{o.destinationAddress}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {o.roundAndTime} • נהג: {o.driver}
                        </span>
                      </div>

                      <div className="text-left">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md text-xs ${
                            o.depositsSummary.includes('פטור')
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {o.depositsSummary || 'פטור'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CRM PROFILE & PROJECT SITES */}
          {activeTab === 'crm_profile' && (
            <div className="space-y-4">
              {/* Comax & Master Info */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <h4 className="text-xs font-extrabold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>נתוני הנהלת חשבונות Comax ERP</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-medium block text-[11px]">מספר כרטיס קומקס:</span>
                    <strong className="text-slate-900 font-mono text-sm">{client.comaxId || '607145'}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-medium block text-[11px]">שם כרטיס בהנה״ח:</span>
                    <strong className="text-slate-900">{client.comaxCardName || client.name}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-medium block text-[11px]">נהג ברירת מחדל:</span>
                    <strong className="text-slate-900">{client.defaultDriver || 'חכמת (מרצדס מנוף)'}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-medium block text-[11px]">מחסן העמסה ראשי:</span>
                    <strong className="text-slate-900">{client.defaultWarehouse || 'מחסן 4 (החרש)'}</strong>
                  </div>
                </div>
              </div>

              {/* Projects & Delivery Sites */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <h4 className="text-xs font-extrabold text-slate-900 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>אתרי פרויקטים וכתובות פריקה קבועות</span>
                </h4>

                <div className="space-y-2 text-xs">
                  {(client.projects && client.projects.length > 0 ? client.projects : [client.address || `${client.city}`]).map((proj, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="font-bold text-slate-800">{proj}</span>
                      </div>

                      <a
                        href={`https://www.waze.com/ul?q=${encodeURIComponent(proj)}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded-lg transition"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>נווט בוויז</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phone Contacts Directory */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <h4 className="text-xs font-extrabold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>מדריך אנשי קשר וטלפונים באתרים</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px]">איש קשר ראשי:</span>
                      <strong className="text-slate-800">{client.contactPerson || client.name}</strong>
                      <span className="font-mono text-slate-600 block text-xs mt-0.5">{client.phone}</span>
                    </div>

                    <a
                      href={`tel:${client.phone}`}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>

                  {client.altPhone && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[11px]">טלפון נוסף באתר:</span>
                        <span className="font-mono text-slate-800 block font-bold text-xs mt-0.5">{client.altPhone}</span>
                      </div>

                      <a
                        href={`tel:${client.altPhone}`}
                        className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>

        {/* Footer Bar with Action Buttons */}
        <div className="px-5 py-3.5 win-mica border-t border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>סנכרון תקין מול Google Sheets ו-Drive • ח. סבן חומרי בניין (1994) בע"מ</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewOrderForClient(client);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>פתח הזמנה חדשה לקבלן</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              סגור
            </button>
          </div>
        </div>
      </motion.div>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md text-right"
            onClick={() => setPreviewDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewDoc(null)}
                className="absolute left-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{previewDoc.title}</h3>
                  <p className="text-xs text-slate-500 font-mono">ח. סבן חומרי בניין (1994) בע"מ</p>
                </div>
              </div>

              {previewDoc.order ? (
                <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {checkBelaDepositAlert(previewDoc.order).hasAlert && (
                    <div className="p-2.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 flex items-start gap-2">
                      <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black">התראת חיוב: בלות ללא פיקדון (מק״ט 60002)!</span>
                          <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[10px]">
                            {checkBelaDepositAlert(previewDoc.order).isExempt ? 'מסומן פטור' : 'ללא פיקדון'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-red-700 leading-snug">
                          התעודה כוללת שקי בלה אך שדה הפיקדונות מסומן כפטור או ריק. יש לוודא אישור חריג או עמידה בסף מינימום משטח לפני הפקה לחשבונית.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">מספר תעודה בקומקס:</span>
                    <span className="font-mono font-bold text-blue-700">#{previewDoc.order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">שם לקוח / קבלן:</span>
                    <span className="font-bold text-slate-900">{previewDoc.order.clientName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">יעד פריקה:</span>
                    <span className="font-bold text-slate-900">{previewDoc.order.destinationAddress}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">נהג ורכב:</span>
                    <span className="font-bold text-slate-900">{previewDoc.order.driver}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">סניף העמסה:</span>
                    <span className="font-bold text-slate-900">{previewDoc.order.warehouse}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">פירוט פריטים ומטען:</span>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 leading-relaxed">
                      {previewDoc.order.productsSummary}
                    </div>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">מאזן פקדונות נלווה:</span>
                    <span className="font-bold text-amber-800">{previewDoc.order.depositsSummary || 'פטור'}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <p className="font-bold text-slate-800">מסמך מסונכרן מתיקיית Drive של הלקוח</p>
                  <p className="text-slate-600 font-mono text-[11px]">{previewDoc.filename || previewDoc.title}</p>
                  <p className="text-slate-500">מאומת בחתימה דיגיטלית של סדרנות העבודה והנהלת החשבונות.</p>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>הדפסת תעודה</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                >
                  סגור תצוגה
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )}
</AnimatePresence>
  );
};
