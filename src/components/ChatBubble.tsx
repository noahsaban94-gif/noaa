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
  Package
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
            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-blue-500/30"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-sky-700 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
          ראמי
        </div>
      )}

      {/* Message Box */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isNoa ? 'items-start' : 'items-end'}`}>
        {/* Name header */}
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400 font-bold">
          {isNoa ? (
            <>
              <span className="text-blue-700 font-extrabold">נועה AI</span>
              <span className="text-[10px] px-1 rounded bg-blue-50 text-blue-600 font-normal">סדרנית ח.סבן</span>
            </>
          ) : (
            <span className="text-slate-600 font-semibold">ראמי מסארוה</span>
          )}
          <span className="text-[10px] text-slate-400 font-normal">{message.timestamp}</span>
        </div>

        {/* Bubble Content */}
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

        {/* Quick Action Buttons */}
        {isNoa && message.quickActions && message.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 mr-1">
            {message.quickActions.map((action, idx) => (
              <button
                key={idx}
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
      </div>
    </div>
  );
};
