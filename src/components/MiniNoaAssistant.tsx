import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Minus,
  Send,
  Sparkles,
  Phone,
  Clock,
  Package,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ArrowUpRight,
  Maximize2
} from 'lucide-react';
import { Order } from '../types';
import { NOA_AVATAR_IMAGE } from '../data/mockAndInitialData';
import { processNoaOrderIntent, NoaIntentResult } from '../utils/noaIntentEngine';

export interface MiniNoaAssistantProps {
  order: Order;
  onUpdateOrder?: (updatedOrder: Order) => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  onExpandToFullChat?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'noa' | 'user';
  text: string;
  timestamp: string;
  actionCard?: NoaIntentResult['actionCard'];
}

export const MiniNoaAssistant: React.FC<MiniNoaAssistantProps> = ({
  order,
  onUpdateOrder,
  isOpen: controlledIsOpen,
  onToggleOpen,
  onExpandToFullChat,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (value: boolean) => {
    if (onToggleOpen) {
      onToggleOpen(value);
    } else {
      setInternalIsOpen(value);
    }
  };

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize messages tailored to this active order
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'noa',
      text: `שלום ${order.clientName}! 🌹\nאני נועה AI, העוזרת האישית של הזמנה #${order.orderNumber}.\nשאל אותי על סטטוס המשלוח, בקש לשנות שעת פריקה, או הוסף מוצרים להעמסה!`,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    // Specialized Intent Engine execution
    setTimeout(async () => {
      const result: NoaIntentResult = processNoaOrderIntent(query, order);

      // If the intent resulted in an order update (e.g. time change or item addition)
      if (result.updatedOrder && onUpdateOrder) {
        onUpdateOrder(result.updatedOrder);
      }

      // If it's a general query, optionally try server Gemini chat for rich answering
      let finalReplyText = result.replyText;
      if (result.intent === 'general') {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `פנייה מלקוח (${order.clientName}) לגבי הזמנה #${order.orderNumber} בח. סבן (מוצרים: ${order.productsSummary}, סטטוס: ${order.status}, מועד: ${order.roundAndTime}, נהג: ${order.driver}, יעד: ${order.destinationAddress}): ${query}`,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              finalReplyText = data.text;
            }
          }
        } catch {
          // Fall back to engine default
        }
      }

      setIsTyping(false);

      const noaMsg: ChatMessage = {
        id: `noa-${Date.now()}`,
        sender: 'noa',
        text: finalReplyText,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        actionCard: result.actionCard,
      };

      setMessages((prev) => [...prev, noaMsg]);

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    }, 600);
  };

  const handleActionOptionClick = (actionText: string) => {
    handleSendMessage(actionText);
  };

  return (
    <aside aria-label="נועה AI - עוזרת מעקב משלוח" className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 flex flex-col items-end font-sans dir-rtl">
      {/* EXPANDED MINIATURIZED WINDOW */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-white rounded-3xl border border-slate-300/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-3.5 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={NOA_AVATAR_IMAGE}
                  alt="נועה AI"
                  className="w-8 h-8 rounded-xl object-cover border-2 border-blue-400 shadow-xs"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-white">נועה AI — עוזרת מעקב</h4>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                    SabanOS
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-300">
                  <span className="text-amber-300 font-mono font-bold">#{order.orderNumber}</span>
                  <span>•</span>
                  <span className="truncate max-w-[120px]">{order.clientName}</span>
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              {onExpandToFullChat && (
                <button
                  type="button"
                  onClick={onExpandToFullChat}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="פתח בצ'אט מלא"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="מזער חלונית"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Order Status Quick Ribbon */}
          <div className="bg-blue-50/90 border-b border-blue-100 px-3 py-1.5 flex items-center justify-between text-[11px] text-blue-900 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="font-bold">סטטוס:</span>
              <span className="font-extrabold text-blue-700">{order.status}</span>
            </div>
            <div className="text-[10px] text-blue-800 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>{order.roundAndTime}</span>
            </div>
          </div>

          {/* Specialized Intent Suggestion Chips */}
          <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200/80 overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar">
            <button
              type="button"
              onClick={() => handleSendMessage('מה הסטטוס של המשלוח שלי?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold border border-slate-200 shadow-2xs transition flex items-center gap-1"
            >
              <span>סטטוס משלוח 🚚</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage('אפשר לשנות שעת פריקה?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold border border-slate-200 shadow-2xs transition flex items-center gap-1"
            >
              <span>שינוי שעה ⏰</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage('הוסף 2 שקי מלט להזמנה')}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-200 shadow-2xs transition flex items-center gap-1"
            >
              <span>+2 שקי מלט ➕</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage('מי הנהג שלי ומתי הוא מגיע?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold border border-slate-200 shadow-2xs transition flex items-center gap-1"
            >
              <span>פרטי נהג 👨‍✈️</span>
            </button>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/40 text-xs">
            {messages.map((msg) => {
              const isNoa = msg.sender === 'noa';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isNoa ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {isNoa ? (
                    <img
                      src={NOA_AVATAR_IMAGE}
                      alt="נועה"
                      className="w-6 h-6 rounded-lg object-cover border border-blue-200 shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      אתה
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-1.5 ${isNoa ? 'text-right' : 'text-right'}`}>
                    <div
                      className={`p-2.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                        isNoa
                          ? 'bg-white text-slate-800 border border-slate-200 shadow-2xs'
                          : 'bg-blue-600 text-white shadow-2xs rounded-tr-none'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Specialized Intent Action Card */}
                    {msg.actionCard && (
                      <div className="p-2.5 rounded-xl bg-white border border-blue-200 shadow-xs space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900">{msg.actionCard.title}</span>
                          {msg.actionCard.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {msg.actionCard.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-slate-600 text-[10px] leading-snug">{msg.actionCard.details}</p>

                        {/* Interactive options / quick rounds */}
                        {msg.actionCard.options && (
                          <div className="grid grid-cols-1 gap-1 pt-1">
                            {msg.actionCard.options.map((opt, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleActionOptionClick(opt.actionText)}
                                className="w-full text-right px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] transition flex items-center justify-between border border-blue-100 active:scale-98"
                              >
                                <span>{opt.label}</span>
                                <ArrowUpRight className="w-3 h-3 text-blue-600 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 block px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-500 text-[11px] p-2 bg-white rounded-xl border border-slate-200 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-200" />
                <span className="font-bold text-slate-600 mr-1">נועה בודקת את ההזמנה...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="שאל על סטטוס, שנה שעה, או הוסף שקים..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping}
              className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition active:scale-95 shrink-0 shadow-xs"
              title="שלח"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* FLOATING TRIGGER BUTTON / PILL (WHEN COLLAPSED) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl border border-slate-700/80 transition-all duration-200 active:scale-95"
          title="פתח את העוזרת הדיגיטלית נועה AI"
        >
          {/* Avatar with pulsing halo */}
          <div className="relative shrink-0">
            <img
              src={NOA_AVATAR_IMAGE}
              alt="נועה AI"
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-400 shadow-md"
            />
            <span className="absolute 0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white group-hover:text-blue-200">
                נועה AI
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-300 text-[9px] font-bold border border-blue-400/30">
                פעילה 🌹
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-mono">
              עוזרת להזמנה #{order.orderNumber}
            </p>
          </div>

          {/* Unread badge if any */}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </aside>
  );
};
