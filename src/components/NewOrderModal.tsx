import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Truck,
  Building2,
  Package,
  MapPin,
  Calendar,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { Order, Client } from '../types';
import { INITIAL_CLIENTS } from '../data/mockAndInitialData';
import { normalizeOrderText } from '../lib/normalizer';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (newOrder: Partial<Order>) => void;
  preselectedClient?: Client | null;
  initialDate?: string;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onSaveOrder,
  preselectedClient,
  initialDate,
}) => {
  const [clientName, setClientName] = useState(preselectedClient?.name || '');
  const [clientPhone, setClientPhone] = useState(preselectedClient?.phone || '');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [targetDate, setTargetDate] = useState(initialDate || '2026-09-13');
  const [roundAndTime, setRoundAndTime] = useState('סבב 1 (07:30)');
  const [rawOrderText, setRawOrderText] = useState('');
  const [productsSummary, setProductsSummary] = useState('');
  const [warehouse, setWarehouse] = useState<'🏟️ 1️⃣ (התלמיד)' | '🏭 4️⃣ (החרש)'>('🏭 4️⃣ (החרש)');
  const [driver, setDriver] = useState<'עלי (משאית איסוזו)' | 'חכמת (מרצדס מנוף)'>('חכמת (מרצדס מנוף)');
  const [depositsSummary, setDepositsSummary] = useState('פטור');
  const [notes, setNotes] = useState('');
  const [isNormalized, setIsNormalized] = useState(false);

  // Update targetDate if initialDate changes
  React.useEffect(() => {
    if (initialDate) setTargetDate(initialDate);
  }, [initialDate]);

  if (!isOpen) return null;

  // Run auto normalizer on raw text
  const handleNormalize = () => {
    if (!rawOrderText.trim()) return;
    const result = normalizeOrderText(rawOrderText);

    const summary = result.items
      .map((item) => `${item.quantity} ${item.name}`)
      .join(', ');

    setProductsSummary(summary);
    setDepositsSummary(result.deposits.depositSummary);
    setWarehouse(result.recommendedWarehouse);
    setDriver(result.recommendedDriver);
    setIsNormalized(true);
  };

  const handleSelectClient = (client: Client) => {
    setClientName(client.name);
    setClientPhone(client.phone);
    if (client.defaultDriver) setDriver(client.defaultDriver);
    if (client.defaultWarehouse) setWarehouse(client.defaultWarehouse);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || (!productsSummary && !rawOrderText)) {
      alert('נא למלא שם לקוח ופירוט פריטים');
      return;
    }

    const finalSummary = productsSummary || rawOrderText;
    const orderNumber = `${Math.floor(6215100 + Math.random() * 900)}`;
    const wazeUrl = `https://www.waze.com/ul?q=${encodeURIComponent(destinationAddress || 'רעננה')}&navigate=yes`;

    onSaveOrder({
      orderNumber,
      clientName,
      clientPhone,
      destinationAddress: destinationAddress || 'הוד השרון',
      date: targetDate,
      roundAndTime,
      warehouse,
      driver,
      productsSummary: finalSummary,
      depositsSummary,
      wazeUrl,
      notes,
      status: 'בסידור עבודה',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in text-right">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 win-mica border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">הזמנה חדשה לסידור עבודה</h2>
              <p className="text-xs text-slate-500">סנכרון ישיר ל-Google Sheet ומנוע נרמול נועה AI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Quick Paste & AI Normalizer Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-sky-50/50 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>הדבק טקסט חופשי מקבלן או וואטסאפ (נרמול מהיר):</span>
              </div>
              <button
                type="button"
                onClick={handleNormalize}
                disabled={!rawOrderText.trim()}
                className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold transition shadow-xs flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>נרמל פריטים ופקדונות</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={rawOrderText}
              onChange={(e) => {
                setRawOrderText(e.target.value);
                setIsNormalized(false);
              }}
              placeholder="למשל: 3 בלות חול, 2 בלות סומסום, 30 שקי מלט אפור 25 ק''ג, 50 לוחות גבס לבן..."
              className="w-full bg-white border border-blue-200/80 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />

            {isNormalized && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>נועה AI נרמלה את הפריטים, חישבה פקדונות ושיבצה נהג ומחסן באופן אוטומטי!</span>
              </div>
            )}
          </div>

          {/* Client Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">בחר קבלן מרשימת ח.סבן:</label>
              <select
                onChange={(e) => {
                  const found = INITIAL_CLIENTS.find((c) => c.name === e.target.value);
                  if (found) handleSelectClient(found);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">-- בחר קבלן קיים או הקלד ידנית --</option>
                {INITIAL_CLIENTS.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">שם לקוח / פרויקט:</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="למשל: בן ענבר פרויקטים בע״מ"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Destination & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">כתובת יעד לפריקה:</label>
              <input
                type="text"
                required
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="למשל: רוטשילד 45, כפר סבא"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">טלפון לתיאום:</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="050-XXXXXXX"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Products Summary & Deposits */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">פירוט מוצרים וכמויות:</label>
            <input
              type="text"
              required
              value={productsSummary}
              onChange={(e) => setProductsSummary(e.target.value)}
              placeholder="50 לוח גבס לבן, 30 ניצב 70, 2 בלות חול..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Delivery Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>תאריך אספקה:</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Round & Time */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">סבב ושעה:</label>
              <select
                value={roundAndTime}
                onChange={(e) => setRoundAndTime(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
              >
                <option value="סבב 1 (07:30)">סבב 1 (07:30)</option>
                <option value="סבב 2 (10:30)">סבב 2 (10:30)</option>
                <option value="סבב 3 (13:30)">סבב 3 (13:30)</option>
                <option value="סבב 4 (15:30)">סבב 4 (15:30)</option>
              </select>
            </div>

            {/* Warehouse */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">מחסן מקור:</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
              >
                <option value="🏭 4️⃣ (החרש)">🏭 4️⃣ (החרש) - מלט/בלות</option>
                <option value="🏟️ 1️⃣ (התלמיד)">🏟️ 1️⃣ (התלמיד) - גבס/בידוד</option>
              </select>
            </div>

            {/* Driver */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">שיבוץ נהג:</label>
              <select
                value={driver}
                onChange={(e) => setDriver(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
              >
                <option value="חכמת (מרצדס מנוף)">חכמת (מרצדס מנוף)</option>
                <option value="עלי (משאית איסוזו)">עלי (משאית איסוזו)</option>
              </select>
            </div>
          </div>

          {/* Deposits Summary */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">פקדונות לתעודה:</label>
            <input
              type="text"
              value={depositsSummary}
              onChange={(e) => setDepositsSummary(e.target.value)}
              placeholder="למשל: 5 בלות (60002), 1 משטח סבן (60060) או פטור"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">הערות פריקה / מנוף:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="למשל: קומה 2 במנוף, לתאם מול סאלח 15 דקות לפני הגעה"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
            >
              ביטול
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>שמור והכנס לסידור עבודה</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
