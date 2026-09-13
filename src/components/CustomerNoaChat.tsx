import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Phone, MessageSquare, PlusCircle, XCircle, Package, Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Order, CustomerRequest } from '../types';
import { NOA_AVATAR_IMAGE } from '../data/mockAndInitialData';

interface CustomerChatMessage {
  id: string;
  sender: 'noa' | 'customer';
  text: string;
  timestamp: string;
  actionCard?: {
    type: 'addition_confirmed' | 'cancellation_pending' | 'waze_navigate' | 'call_rami';
    title: string;
    details: string;
    badge?: string;
  };
}

interface CustomerNoaChatProps {
  order: Order;
  onUpdateOrder?: (updatedOrder: Order) => void;
}

export const CustomerNoaChat: React.FC<CustomerNoaChatProps> = ({ order, onUpdateOrder }) => {
  const [messages, setMessages] = useState<CustomerChatMessage[]>(() => {
    // Initial friendly greeting from Noa
    return [
      {
        id: 'msg-welcome',
        sender: 'noa',
        text: `שלום ${order.clientName} יקר! 🌹\nאני נועה AI, סדרנית ועוזרת השירות הדיגיטלית של ח. סבן חומרי בניין (1994) בע"מ.\nאני מלווה את הזמנה #${order.orderNumber} שלך. איך אוכל לעזור לך עכשיו?`,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [additionModalOpen, setAdditionModalOpen] = useState(false);
  const [additionText, setAdditionText] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addNoaReply = (text: string, actionCard?: CustomerChatMessage['actionCard']) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const newMsg: CustomerChatMessage = {
        id: `noa-${Date.now()}`,
        sender: 'noa',
        text,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        actionCard,
      };
      setMessages((prev) => [...prev, newMsg]);
    }, 700);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputVal;
    if (!textToSend.trim()) return;

    const userMsg: CustomerChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'customer',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputVal('');

    const lower = textToSend.toLowerCase();

    // 1. QUESTION: Order Content (מה תכולת הזמנה)
    if (lower.includes('תכול') || lower.includes('מה יש') || lower.includes('מוצרים') || lower.includes('מה הזמנתי') || lower.includes('פירוט')) {
      const reply = `הנה פירוט המוצרים בהזמנה מס' #${order.orderNumber}:\n\n` +
        `📦 *מוצרים וכמויות:*\n${order.productsSummary}\n\n` +
        `🛡️ *פקדונות משטחים ובלות:*\n${order.depositsSummary || 'פטור מחיוב פקדון'}\n\n` +
        `מחסן מנפק: ${order.warehouse || 'מחסן 4 (החרש)'}.\nאם תרצה להוסיף מוצרים נוספים להעמסה זו, פשוט עדכן אותי כאן!`;
      addNoaReply(reply);
      return;
    }

    // 2. QUESTION: Where is order / ETA / Driver (מעקב הזמנה / איפה הנהג)
    if (lower.includes('איפה') || lower.includes('מתי') || lower.includes('זמן') || lower.includes('נהג') || lower.includes('מעקב') || lower.includes('הגעה') || lower.includes('בדרך')) {
      const driverName = order.driver || 'צוות חלוקה ח. סבן';
      const driverPhone = order.driver.includes('חכמת') ? '050-8860897' : order.driver.includes('עלי') ? '050-8860898' : '050-8860896';
      
      let statusDetails = '';
      if (order.status === 'בסידור עבודה') {
        statusDetails = 'ההזמנה בסידור עבודה ומוקצית לסבב המתוכנן.';
      } else if (order.status === 'מוכן להעמסה' || order.status === 'בטעינה במחסן') {
        statusDetails = 'הצוות במחסן מלקט כעת את המוצרים ומעמיס על המשאית.';
      } else if (order.status === 'בדרך ללקוח') {
        statusDetails = 'המשאית יצאה מהמחסן ונמצאת בנסיעה פעילה אליך!';
      } else if (order.status === 'נמסר באתר') {
        statusDetails = 'ההזמנה נפרקה ונמסרה בהצלחה באתר היעד.';
      } else {
        statusDetails = 'קיים עיכוב קל עקב עומסי תנועה / פריקה קודמת.';
      }

      const reply = `סטטוס המשלוח הנוכחי עבור הזמנה #${order.orderNumber}:\n\n` +
        `⚡ *סטטוס:* ${order.status}\n` +
        `⏱️ *מועד אספקה מתוכנן:* ${order.roundAndTime} (${order.date || 'היום'})\n` +
        `🚚 *נהג משובץ:* ${driverName} (טל' ישיר: ${driverPhone})\n` +
        `📍 *יעד פריקה:* ${order.destinationAddress}\n\n` +
        `${statusDetails}`;

      addNoaReply(reply, {
        type: 'waze_navigate',
        title: 'פרטי הגעת משאית',
        details: `נהג: ${driverName} • יעד: ${order.destinationAddress}`,
        badge: order.status,
      });
      return;
    }

    // 3. ACTION: Add items to order (תוספת להזמנה)
    if (lower.includes('להוסיף') || lower.includes('תוספת') || lower.includes('עוד שק') || lower.includes('עוד לוח') || lower.includes('הוספתי')) {
      setAdditionModalOpen(true);
      const reply = `בשמחה רבה! 🛠️ פתחתי עבורך חלונית מהירה להוספת פריטים להזמנה #${order.orderNumber}.\n` +
        `תוכל לכתוב בדיוק מה חסר לך (לדוגמה: "3 שקי טיח חוץ, 1 בלה חול מחצבה") ואני אעדכן מיידית את ראמי מסארוה והמחסן להעמסה מהירה.`;
      addNoaReply(reply);
      return;
    }

    // 4. ACTION: Cancel order (ביטול הזמנה)
    if (lower.includes('ביטול') || lower.includes('לבטל') || lower.includes('בטל')) {
      const isAlreadyOnTheWay = order.status === 'בדרך ללקוח' || order.status === 'נמסר באתר';
      
      const newRequest: CustomerRequest = {
        id: `req-cancel-${Date.now()}`,
        type: 'cancellation',
        content: `בקשת ביטול מהלקוח ${order.clientName} עבור הזמנה #${order.orderNumber}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
        responseFromNoa: isAlreadyOnTheWay
          ? 'המשאית כבר יצאה לדרך, הועבר לטיפול דחוף אצל ראמי'
          : 'ההזמנה נעצרה בסידור, נשלחה התראה מיידית לראמי',
      };

      const updatedOrder: Order = {
        ...order,
        customerRequests: [...(order.customerRequests || []), newRequest],
        notes: `${order.notes ? order.notes + ' | ' : ''}⚠️ בקשת ביטול מלקוח (${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })})`,
      };

      if (onUpdateOrder) {
        onUpdateOrder(updatedOrder);
      }

      if (isAlreadyOnTheWay) {
        const reply = `⚠️ שים לב: הזמנה #${order.orderNumber} נמצאת כעת בסטטוס "${order.status}" (המשאית כבר בנסיעה או נפרקה באתר).\n\n` +
          `העברתי התראת ביטול דחופה לראמי מסארוה (סדרן ראשי). על מנת לעצור את הנהג מיידית, מומלץ לחייג ישירות לראמי בטלפון: 050-8860896.`;
        addNoaReply(reply, {
          type: 'call_rami',
          title: 'התראת ביטול הועברה לסדרן',
          details: 'משאית בתנועה — חייג מיידית לראמי לעצירת פריקה',
          badge: 'דחוף ⚠️',
        });
      } else {
        const reply = `קיבלתי את בקשתך לביטול הזמנה #${order.orderNumber}. 🛑\n\n` +
          `רשמתי את הבקשה במערכת SabanOS והעברתי הודעה מיידית לראמי מסארוה ולמחסן לעצור את הליקוט והטעינה.\nאישור סופי יישלח אליך בהקדם.`;
        addNoaReply(reply, {
          type: 'cancellation_pending',
          title: 'בקשת ביטול נקלטה בהצלחה',
          details: 'נשלחה הודעה לראמי מסארוה לעצור את הטעינה במחסן',
          badge: 'בטיפול ⏳',
        });
      }
      return;
    }

    // 5. General / Free Query via Gemini Backend or Fallback
    try {
      setIsTyping(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `שאלה מלקוח (${order.clientName}) לגבי הזמנה #${order.orderNumber} (${order.destinationAddress}, מוצרים: ${order.productsSummary}, נהג: ${order.driver}, סטטוס: ${order.status}): ${textToSend}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsTyping(false);
        const replyText = data.text || `תודה על פנייתך ${order.clientName}. צוות ח. סבן יעמוד לרשותך בכל עת. ראמי מסארוה זמין בטלפון 050-8860896.`;
        addNoaReply(replyText);
      } else {
        throw new Error('Chat API returned error');
      }
    } catch {
      setIsTyping(false);
      addNoaReply(`תודה על שאלתך! קיבלתי את ההודעה עבור הזמנה #${order.orderNumber}. ראמי מסארוה והצוות שלנו בח. סבן זמינים עבורך בכל עת גם בטלפון 050-8860896.`);
    }
  };

  const handleConfirmAddition = () => {
    if (!additionText.trim()) return;

    const newRequest: CustomerRequest = {
      id: `req-add-${Date.now()}`,
      type: 'addition',
      content: `בקשת תוספת להזמנה #${order.orderNumber}: ${additionText.trim()}`,
      addedItems: additionText.trim(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      responseFromNoa: 'תוספת נרשמה והועברה לראמי במחסן',
    };

    const updatedOrder: Order = {
      ...order,
      productsSummary: `${order.productsSummary} + [תוספת לקוח: ${additionText.trim()}]`,
      customerRequests: [...(order.customerRequests || []), newRequest],
      notes: `${order.notes ? order.notes + ' | ' : ''}➕ תוספת לקוח: ${additionText.trim()}`,
    };

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    const itemsAdded = additionText.trim();
    setAdditionText('');
    setAdditionModalOpen(false);

    // Add customer message
    const userMsg: CustomerChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'customer',
      text: `אני מבקש להוסיף להזמנה #${order.orderNumber} את הפריטים הבאים:\n${itemsAdded}`,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Add Noa reply
    addNoaReply(
      `מעולה! 👏 קלטתי בהצלחה את בקשת התוספת להזמנה #${order.orderNumber}:\n` +
      `➕ *פריטים שנוספו:* ${itemsAdded}\n\n` +
      `הודעתי נשלחה ישירות למסוף של ראמי מסארוה ולמחסן על מנת לצרף את הפריטים למשאית של ${order.driver}.\n` +
      `במידה ויידרש משטח נוסף או חיוב פקדון, הוא יתעדכן אוטומטית בחשבונית.`,
      {
        type: 'addition_confirmed',
        title: 'בקשת תוספת נקלטה בסידור!',
        details: `פריטים: ${itemsAdded} • סדרן ראמי עודכן בהתראה חיה`,
        badge: 'נרשם בהצלחה ✅',
      }
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[560px] text-right font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={NOA_AVATAR_IMAGE}
              alt="נועה AI"
              className="w-10 h-10 rounded-2xl object-cover border-2 border-blue-400/80 shadow-xs"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black tracking-tight text-white">נועה AI — שירות לקוחות ומעקב</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                SabanOS
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              מענה מיידי להזמנה #{order.orderNumber} • {order.clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:0508860896"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
            title="חייג לסדרן הראשי ראמי"
          >
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">ראמי מסארוה</span>
          </a>
        </div>
      </div>

      {/* Suggested Action Chips */}
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200/70 overflow-x-auto flex items-center gap-2 shrink-0 no-scrollbar">
        <button
          type="button"
          onClick={() => handleSendMessage('מה תכולת ההזמנה שלי?')}
          className="whitespace-nowrap px-3 py-1 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold border border-slate-200 shadow-2xs transition flex items-center gap-1.5 shrink-0"
        >
          <Package className="w-3.5 h-3.5 text-blue-600" />
          <span>תכולת הזמנה</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('איפה הנהג ומתי המשלוח מגיע?')}
          className="whitespace-nowrap px-3 py-1 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold border border-slate-200 shadow-2xs transition flex items-center gap-1.5 shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>מעקב הגעה</span>
        </button>

        <button
          type="button"
          onClick={() => setAdditionModalOpen(true)}
          className="whitespace-nowrap px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200 shadow-2xs transition flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>תוספת להזמנה ➕</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('אני רוצה לבטל את ההזמנה')}
          className="whitespace-nowrap px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-black border border-rose-200 shadow-2xs transition flex items-center gap-1.5 shrink-0"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>ביטול הזמנה 🛑</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('מה הפקדונות על המשטחים והבלות?')}
          className="whitespace-nowrap px-3 py-1 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold border border-slate-200 shadow-2xs transition flex items-center gap-1.5 shrink-0"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>פקדונות</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {messages.map((msg) => {
          const isNoa = msg.sender === 'noa';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isNoa ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {isNoa ? (
                <img
                  src={NOA_AVATAR_IMAGE}
                  alt="נועה"
                  className="w-8 h-8 rounded-xl object-cover border border-blue-200 shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  לקוח
                </div>
              )}

              <div className={`max-w-[85%] space-y-1.5 ${isNoa ? 'text-right' : 'text-right'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    isNoa
                      ? 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Optional Action Card */}
                {msg.actionCard && (
                  <div className="p-3 rounded-2xl bg-white border border-blue-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {msg.actionCard.type === 'addition_confirmed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {msg.actionCard.type === 'cancellation_pending' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                        {msg.actionCard.type === 'call_rami' && <AlertCircle className="w-4 h-4 text-rose-600" />}
                        {msg.actionCard.type === 'waze_navigate' && <Clock className="w-4 h-4 text-blue-600" />}
                        <span className="font-extrabold text-xs text-slate-900">{msg.actionCard.title}</span>
                      </div>
                      {msg.actionCard.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {msg.actionCard.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">{msg.actionCard.details}</p>

                    <div className="pt-1 flex items-center gap-2">
                      <a
                        href="tel:0508860896"
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>חייג לראמי הסדרן</span>
                      </a>

                      <a
                        href="https://wa.me/972508860896"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>וואטסאפ למוקד</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 px-1">{msg.timestamp}</div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-500 text-xs italic py-1">
            <img src={NOA_AVATAR_IMAGE} alt="נועה" className="w-6 h-6 rounded-lg object-cover" />
            <span>נועה AI מקלידה תשובה...</span>
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setAdditionModalOpen(true)}
            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200 shrink-0"
            title="הוספת פריט להזמנה"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="שאל את נועה על ההזמנה, תכולה, זמני הגעה או תוספת..."
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || isTyping}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shrink-0 shadow-xs"
            title="שלח הודעה"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>

      {/* Quick Item Addition Modal */}
      {additionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">תוספת פריטים להזמנה #{order.orderNumber}</h4>
                  <p className="text-[11px] text-slate-500">הבקשה תועבר ישירות לראמי מסארוה ולמחסן</p>
                </div>
              </div>
              <button
                onClick={() => setAdditionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                פרט את המוצרים והכמויות שברצונך להוסיף:
              </label>
              <textarea
                rows={3}
                value={additionText}
                onChange={(e) => setAdditionText(e.target.value)}
                placeholder="למשל: 3 שקי מלט נשר 50 ק''ג, 2 לוחות גבס 4K..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
              💡 <strong>לתשומת לבך:</strong> נועה תעדכן את המחסן המנפק ({order.warehouse || 'מחסן 4 החרש'}) ותחשב את הפקדונות הנדרשים לבלות ולמשטחים.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmAddition}
                disabled={!additionText.trim()}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm disabled:opacity-50 transition"
              >
                אשר ושדר בקשת תוספת 🚀
              </button>
              <button
                type="button"
                onClick={() => setAdditionModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
