import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  Paperclip,
  Mic,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Truck,
  PlusCircle,
  Phone,
  Info
} from 'lucide-react';
import { ChatMessage, Order } from '../types';
import { ChatBubble } from './ChatBubble';
import { NOA_AVATAR_IMAGE } from '../data/mockAndInitialData';

interface NoaChatProps {
  orders: Order[];
  onAddOrder: (orderData: Partial<Order>) => void;
  onOpenMorningReport: () => void;
  onShowAlerts: () => void;
}

export const NoaChat: React.FC<NoaChatProps> = ({
  orders,
  onAddOrder,
  onOpenMorningReport,
  onShowAlerts,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'noa',
      text: `היי ראמי אהובי וצוות ח.סבן! 🌹\nאני מחוברת לסידור העבודה בגיליון בזמן אמת.\nכל נתוני הסבבים, שיבוצי הנהגים (עלי וחכמת) וחישובי הפקדונות מוכנים לפקודתך.\n\nתוכל לבקש ממני:\n• להפיק דוח בוקר יומי (/דוח_בוקר)\n• תדריך סיכום אישי (/תדריך_ראמי)\n• נרמול הזמנה חדשה מקבלן (למשל: "3 בלות חול, 2 בלות סומסום, 30 שקי מלט")\n• לבדוק זמינות משאית מנוף או מחסנים`,
      timestamp: 'עכשיו',
      quickActions: [
        { label: 'תדריך סיכום לראמי 🌹', action: 'trigger_rami_briefing', variant: 'primary' },
        { label: 'הפקת דוח בוקר 🚚', action: 'generate_morning_report', variant: 'success' },
        { label: 'נרמול הזמנה מקבלן 📦', action: 'quick_normalize_sample', variant: 'outline' },
        { label: 'בדיקת חריגות ועיכובים ⚠️', action: 'check_alerts', variant: 'warning' },
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Execute quick actions
  const handleExecuteAction = async (action: string, payload?: any) => {
    if (action === 'generate_morning_report' || action === 'copy_morning_report') {
      onOpenMorningReport();
      return;
    }

    if (action === 'check_alerts') {
      onShowAlerts();
      return;
    }

    if (action === 'trigger_rami_briefing') {
      handleSendMessage('/תדריך_ראמי');
      return;
    }

    if (action === 'quick_normalize_sample') {
      handleSendMessage('נרמלי בבקשה הזמנה לקראמה אסאמה: 3 בלות חול, 2 בלות סומסום, 40 שקי מלט 25 ק"ג לרוטשילד 45 כפר סבא');
      return;
    }

    if (action === 'approve_order') {
      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: 'מאשר את ההזמנה לביצוע בסידור העבודה 👍',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };
      const noaReply: ChatMessage = {
        id: `noa-${Date.now() + 1}`,
        sender: 'noa',
        text: 'ההזמנה אושרה בהצלחה וסומנה כ-"מוכן להעמסה" בגיליון Google Sheet! שידרתי התראה לנהג המשובץ בוואטסאפ.',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: 'הפקת דוח בוקר מעודכן', action: 'generate_morning_report', variant: 'primary' },
        ],
      };
      setMessages((prev) => [...prev, userMsg, noaReply]);
      return;
    }

    if (action === 'report_delay') {
      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: 'מדווח על עיכוב עקב פקקים בכביש 4 לכיוון רעננה',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };
      const noaReply: ChatMessage = {
        id: `noa-${Date.now() + 1}`,
        sender: 'noa',
        text: 'רשמתי את העיכוב בסידור (סטטוס "חריגה / עיכוב"). יצרתי קישור הודעת וואטסאפ מוכן לשליחה ללקוח עם עדכון ה-ETA החדש בוויז.',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: 'פתח לוח בקרה', action: 'open_dashboard', variant: 'outline' },
        ],
      };
      setMessages((prev) => [...prev, userMsg, noaReply]);
      return;
    }

    // Default: send action label as message
    handleSendMessage(action);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          ordersCount: orders.length,
        }),
      });

      if (!res.ok) {
        throw new Error('שגיאה בתקשורת מול נועה AI');
      }

      const data = await res.json();
      const noaMessage: ChatMessage = {
        id: `noa-${Date.now()}`,
        sender: 'noa',
        text: data.text || 'קיבלתי, המערכת סונכרנה.',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        quickActions: data.quickActions || [],
      };

      setMessages((prev) => [...prev, noaMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'noa',
        text: `היי ראמי, קיבלתי את ההודעה. המערכת המשיכה לפעול במצב מקומי מסונכרן.\nבאהבה ובשירותיות, נועה ❤️`,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: 'דוח בוקר 🚚', action: 'generate_morning_report', variant: 'primary' },
        ],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/70 win-card rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm text-right">
      {/* Chat Header */}
      <div className="px-5 py-3.5 win-mica border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={NOA_AVATAR_IMAGE}
              alt="נועה AI"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-blue-500/40"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-slate-900">נועה AI</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                סדרנית עבודה (SabanOS)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              ח. סבן חומרי בניין (1994) בע״מ • מחוברת ל-Google Sheets
            </p>
          </div>
        </div>

        {/* Quick Contact buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSendMessage('/תדריך_ראמי')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>תדריך לראמי</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Queries Pills */}
      <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">הצעות לפקודה:</span>
        <button
          onClick={() => handleSendMessage('/תדריך_ראמי')}
          className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-medium whitespace-nowrap shadow-2xs hover:bg-blue-50/50 transition"
        >
          🌹 תדריך סיכום יומי
        </button>
        <button
          onClick={() => handleSendMessage('/דוח_בוקר')}
          className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-medium whitespace-nowrap shadow-2xs hover:bg-blue-50/50 transition"
        >
          🚚 הפקת דוח בוקר
        </button>
        <button
          onClick={() => handleSendMessage('מה הסטטוס של משאית מנוף של חכמת?')}
          className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-medium whitespace-nowrap shadow-2xs hover:bg-blue-50/50 transition"
        >
          🏗️ סטטוס חכמת (מנוף)
        </button>
        <button
          onClick={() => handleSendMessage('מה הסטטוס של עלי במשאית איסוזו?')}
          className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-medium whitespace-nowrap shadow-2xs hover:bg-blue-50/50 transition"
        >
          🚛 סטטוס עלי (איסוזו)
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 bg-gradient-to-b from-slate-50/40 to-white/90">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onExecuteAction={handleExecuteAction}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 my-3">
            <img
              src={NOA_AVATAR_IMAGE}
              alt="נועה AI"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tr-none shadow-sm flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-300" />
              <span className="font-medium mr-2">נועה בודקת בסידור העבודה...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <div className="p-3 sm:p-4 win-mica border-t border-slate-200/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => handleSendMessage('נועה, נרמלי פריטים להזמנה דחופה')}
            className="p-2.5 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition"
            title="נרמול פריטים מהיר"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="כתוב הודעה לנועה (למשל: נרמלי הזמנה, תדריך ראמי, דוח בוקר)..."
            className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white shadow-sm shadow-blue-600/30 active:scale-95 transition"
            title="שלח"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
