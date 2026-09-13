import React from 'react';
import {
  Settings,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Truck,
  Building2,
  Database,
  Smartphone,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  onSyncSheet: () => void;
  isSyncing: boolean;
  ordersCount: number;
  onClearOfflineOrders?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onSyncSheet,
  isSyncing,
  ordersCount,
  onClearOfflineOrders,
}) => {
  const SHEET_ID = '1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

  return (
    <div className="space-y-4 max-w-4xl mx-auto text-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 win-card rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">הגדרות מערכת ואינטגרציות</h2>
            <p className="text-xs text-slate-500 font-medium">
              ניהול חיבור Google Sheets, סנכרון קומקס, PWA וצי רכב
            </p>
          </div>
        </div>

        <button
          onClick={onSyncSheet}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>סנכרון מיידי עכשיו</span>
        </button>
      </div>

      {/* Google Sheets Card */}
      <div className="p-5 win-card rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">חיבור Google Sheets (סידור עבודה)</h3>
              <p className="text-xs text-slate-500">עטיפת API מאובטחת דרך צד-שרת (Express Proxy)</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            מחובר בזמן אמת
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-medium">מזהה גיליון (Spreadsheet ID):</span>
            <p className="font-mono font-bold text-slate-800 text-[11px] mt-1 break-all select-all">
              {SHEET_ID}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <span className="text-slate-400 font-medium">גיליון וטאב פעיל:</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-slate-800">דוח_בוקר_מבצעי</span>
              <a
                href={SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <span>פתח ב-Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* PWA & Offline Storage */}
      <div className="p-5 win-card rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">אפליקציה מתקדמת (PWA) ואחסון אופליין</h3>
              <p className="text-xs text-slate-500">Service Worker + שמירה מקומית ב-IndexedDB</p>
            </div>
          </div>
          <PWAInstallButton />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium">מנוע אופליין מקומי:</span>
              <p className="font-bold text-slate-800 mt-0.5">IndexedDB + LocalStorage</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium">הזמנות שמורות במטמון:</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {ordersCount > 0
                  ? `${ordersCount} רשומות מוכנות לעבודה ללא רשת`
                  : '0 רשומות במטמון (נמחק ומוכן)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {ordersCount > 0 && onClearOfflineOrders && (
                <button
                  type="button"
                  onClick={onClearOfflineOrders}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-[11px] transition active:scale-95 shadow-2xs"
                  title="מחק רשומות מוכנות לעבודה ללא רשת"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>מחק רשומות אופליין</span>
                </button>
              )}
              <Database className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Warehouses & Fleet Configuration */}
      <div className="p-5 win-card rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          חוקי שיבוץ סניפים ונהגים (SabanOS Rules)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Warehouse 4 */}
          <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>🏭 מחסן 4️⃣ — החרש (ראשי)</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              חומרי בניין כבדים: מלט אפור/לבן, חול, סומסום, טיט, בלוקים, דבקים ואיטום.
            </p>
            <div className="text-[10px] text-slate-400 font-mono">מנהל: ענבר | שיבוץ מרצדס מנוף</div>
          </div>

          {/* Warehouse 1 */}
          <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>🏟️ מחסן 1️⃣ — התלמיד (גבס וצבע)</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              לוחות גבס (לבן, ירוק, 4K), פרופילים (ניצב/מסלול), צמר בידוד, שפכטלים.
            </p>
            <div className="text-[10px] text-slate-400 font-mono">שיבוץ איסוזו לחלוקה מהירה</div>
          </div>
        </div>
      </div>
    </div>
  );
};
