import React from 'react';
import {
  Check,
  CheckCheck,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Send,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Navigation,
  Package,
  CalendarDays,
  ExternalLink,
  Clock,
  Building2,
  Truck,
  Activity,
} from 'lucide-react';
import { ChatMessage, QuickAction } from '../types';
import { NOA_AVATAR_IMAGE } from '../data/mockAndInitialData';

interface ChatBubbleProps {
  message: ChatMessage;
  onExecuteAction: (action: string, payload?: any) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onExecuteAction,
}) => {
  const isNoa = message.sender === 'noa';
  const isSystem = message.sender === 'system';
  const isSyncAlert = message.isSyncAlert;

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 rounded-full bg-slate-200/70 text-slate-600 text-[11px] font-semibold border border-slate-300/40">
          {message.text}
        </div>
      </div>
    );
  }

  const renderActionIcon = (action: string) => {
    switch (action) {
      case 'open_schedule':
        return <CalendarDays className="w-3.5 h-3.5 text-blue-600" />;
      case 'open_sheet_external':
        return <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />;
      case 'trigger_rami_briefing':
        return <Sparkles className="w-3.5 h-3.5 text-rose-500" />;
      case 'approve_order':
      case 'approve_all':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'report_delay':
      case 'check_alerts':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'generate_morning_report':
      case 'copy_morning_report':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />;
      case 'dispatch_whatsapp_drivers':
        return <Send className="w-3.5 h-3.5 text-emerald-600" />;
      case 'normalize_items':
        return <Package className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <ArrowRight className="w-3 h-3" />;
    }
  };

  return (
    <div className={`flex gap-3 my-3 ${isNoa ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      {isNoa ? (
        <div className="relative flex-shrink-0">
          <img
            src={NOA_AVATAR_IMAGE}
            alt="נועה AI"
            referrerPolicy="no-referrer"
            className={`w-9 h-9 rounded-full object-cover border-2 border-white shadow-md ring-2 ${
              isSyncAlert ? 'ring-emerald-500/50' : 'ring-blue-500/30'
            }`}
          />
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${
              isSyncAlert ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'
            }`}
          />
          {isSyncAlert && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
          )}
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-sky-700 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
          ראמי
        </div>
      )}

      {/* Message Box */}
      <div className={`flex flex-col max-w-[90%] sm:max-w-[80%] ${isNoa ? 'items-start' : 'items-end'}`}>
        {/* Name header */}
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400 font-bold">
          {isNoa ? (
            <>
              <span className="text-blue-700 font-extrabold">נועה AI</span>
              {isSyncAlert ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-black border border-emerald-200">
                  התראת סנכרון Sheets ✅
                </span>
              ) : (
                <span className="text-[10px] px-1 rounded bg-blue-50 text-blue-600 font-normal">
                  סדרנית ח.סבן
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-600 font-semibold">ראמי מסארוה</span>
          )}
          <span className="text-[10px] text-slate-400 font-normal">{message.timestamp}</span>
        </div>

        {/* Bubble Content - SPECIALIZED CUSTOMIZED CARD FOR GOOGLE SHEETS SYNC ALERTS */}
        {isSyncAlert ? (
          <div className="w-full bg-gradient-to-br from-white via-emerald-50/20 to-slate-50 border-2 border-emerald-500/40 rounded-2xl rounded-tr-none p-4 shadow-md transition space-y-3.5">
            {/* Top Alert Header Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900">
                      סנכרון Google Sheets הושלם בהצלחה!
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>LIVE</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-emerald-800">טאב פעיל: דוח_בוקר_מבצעי</span>
                    <span>•</span>
                    <span>ח. סבן חומרי בניין (1994) בע״מ</span>
                    {message.syncData?.syncDurationMs && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{message.syncData.syncDurationMs}ms</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Noa Message Text */}
            <div className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line bg-white/70 p-3 rounded-xl border border-emerald-100/60 shadow-2xs">
              {message.text}
            </div>

            {/* Operational Data Metrics Grid (Bento mini cards) */}
            {message.syncData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Total Orders Card */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                    <Activity className="w-3 h-3 text-blue-500" />
                    <span>סה״כ הזמנות</span>
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {message.syncData.syncedOrdersCount}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-700">בסידור העבודה</div>
                </div>

                {/* Drivers Assignments */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                    <Truck className="w-3 h-3 text-amber-500" />
                    <span>שיבוץ נהגים</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 space-y-0.5">
                    <div>חכמת: <span className="font-black text-amber-700">{message.syncData.driversSummary?.hikmatCount || 0}</span></div>
                    <div>עלי: <span className="font-black text-blue-700">{message.syncData.driversSummary?.aliCount || 0}</span></div>
                  </div>
                </div>

                {/* Warehouses Breakdown */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                    <Building2 className="w-3 h-3 text-indigo-500" />
                    <span>סניפי העמסה</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 space-y-0.5">
                    <div>החרש 4: <span className="font-black text-indigo-700">{message.syncData.warehousesSummary?.hareshCount || 0}</span></div>
                    <div>התלמיד 1: <span className="font-black text-indigo-700">{message.syncData.warehousesSummary?.talmidCount || 0}</span></div>
                  </div>
                </div>

                {/* Execution Statuses */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-emerald-500" />
                    <span>סטטוס ביצוע</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 space-y-0.5">
                    <div className="text-emerald-700">סופקו: {message.syncData.statusBreakdown?.delivered || 0}</div>
                    <div className="text-blue-700">בסידור: {(message.syncData.statusBreakdown?.inSchedule || 0) + (message.syncData.statusBreakdown?.readyForLoading || 0)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Strip */}
            {message.quickActions && message.quickActions.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-2">
                {message.quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onExecuteAction(action.action, action.payload)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shadow-xs active:scale-95 border ${
                      action.variant === 'primary'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-blue-500/20'
                        : action.variant === 'success'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-500/20'
                        : action.variant === 'warning'
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {renderActionIcon(action.action)}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* STANDARD CHAT BUBBLE */
          <>
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm transition ${
                isNoa
                  ? 'bg-white text-slate-800 border border-slate-200/90 rounded-tr-none'
                  : 'bg-blue-600 text-white rounded-tl-none font-medium'
              }`}
            >
              <div className="whitespace-pre-line break-words">{message.text}</div>

              {/* Audio voice message representation if flagged */}
              {message.hasAudio && (
                <div className="mt-2.5 p-2 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center gap-2 text-[11px] text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-semibold">הודעה קולית מוקלטת (תדריך נהגים)</span>
                  <span className="text-[10px] text-slate-400 mr-auto font-mono">0:24</span>
                </div>
              )}
            </div>

            {/* Standard Quick Action Buttons */}
            {isNoa && message.quickActions && message.quickActions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 mr-1">
                {message.quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onExecuteAction(action.action, action.payload)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 border ${
                      action.variant === 'primary'
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                        : action.variant === 'success'
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        : action.variant === 'warning'
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {renderActionIcon(action.action)}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

