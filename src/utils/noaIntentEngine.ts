import { Order, CustomerRequest } from '../types';

export type NoaIntentType =
  | 'delivery_status'
  | 'change_dropoff_time'
  | 'add_items'
  | 'order_content'
  | 'driver_info'
  | 'cancel_order'
  | 'deposits_info'
  | 'general';

export interface NoaIntentResult {
  intent: NoaIntentType;
  replyText: string;
  actionCard?: {
    type: 'status_card' | 'time_changed' | 'addition_confirmed' | 'cancellation_pending' | 'call_rami' | 'quick_options';
    title: string;
    details: string;
    badge?: string;
    options?: { label: string; actionText: string }[];
  };
  updatedOrder?: Order;
}

/**
 * Recognizes the user intent for the current specific order
 * and performs the corresponding business logic, linking back to the order object.
 */
export function processNoaOrderIntent(rawQuery: string, order: Order): NoaIntentResult {
  const text = rawQuery.trim();
  const lower = text.toLowerCase();

  // 1. INTENT: Delivery Status ("what is my delivery status?", "איפה ההזמנה", "סטטוס הגעה", etc.)
  if (
    lower.includes('status') ||
    lower.includes('סטטוס') ||
    lower.includes('איפה ההזמנה') ||
    lower.includes('איפה המשלוח') ||
    lower.includes('מתי מגיע') ||
    lower.includes('מתי זה מגיע') ||
    lower.includes('הגעה') ||
    lower.includes('זמן הגעה') ||
    lower.includes('שלב') ||
    lower.includes('באיזה שלב') ||
    lower.includes('where is my order') ||
    lower.includes('delivery status') ||
    lower.includes('track')
  ) {
    let stageExplanation = '';
    if (order.status === 'בסידור עבודה') {
      stageExplanation = 'ההזמנה שובצה בסידור העבודה היומי וממתינה לפתיחת קו ליקוט וטעינה במחסן.';
    } else if (order.status === 'מוכן להעמסה' || order.status === 'בטעינה במחסן') {
      stageExplanation = 'צוות המחסן מעמיס ברגעים אלו את המוצרים על גבי המשאית של הנהג.';
    } else if (order.status === 'בדרך ללקוח') {
      stageExplanation = 'המשאית יצאה לדרך ונמצאת בנסיעה ישירה אליך לאתר היעד!';
    } else if (order.status === 'נמסר באתר') {
      stageExplanation = 'המשלוח נפרק ונמסר בהצלחה באתר.';
    } else {
      stageExplanation = 'קיים עדכון עיכוב קל עקב עומסי תנועה או פריקה קודמת.';
    }

    const driverPhone = order.driver?.includes('חכמת') ? '050-8860897' : order.driver?.includes('עלי') ? '050-8860898' : '050-8860896';

    const replyText =
      `🚚 *סטטוס משלוח נוכחי להזמנה #${order.orderNumber}:*\n\n` +
      `⚡ *מצב:* ${order.status}\n` +
      `🕒 *מועד פריקה מתוכנן:* ${order.roundAndTime} (${order.date || 'היום'})\n` +
      `📍 *כתובת פריקה:* ${order.destinationAddress}\n` +
      `👨‍✈️ *נהג משובץ:* ${order.driver || 'צוות חלוקה ח. סבן'} (טל' ${driverPhone})\n` +
      `🏭 *מחסן מנפק:* ${order.warehouse || 'מחסן 4 (החרש)'}\n\n` +
      `${stageExplanation}`;

    return {
      intent: 'delivery_status',
      replyText,
      actionCard: {
        type: 'status_card',
        title: `סטטוס: ${order.status}`,
        details: `מועד: ${order.roundAndTime} • נהג: ${order.driver || 'ח. סבן'}`,
        badge: order.status,
      },
    };
  }

  // 2. INTENT: Change Drop-Off Time / Round ("can I change my drop-off time?", "לשנות שעה", "שינוי סבב", etc.)
  if (
    lower.includes('drop-off') ||
    lower.includes('dropoff') ||
    lower.includes('change time') ||
    lower.includes('change my time') ||
    lower.includes('שעת פריקה') ||
    lower.includes('לשנות שעה') ||
    lower.includes('לשנות את השעה') ||
    lower.includes('שינוי שעה') ||
    lower.includes('שנה שעה') ||
    lower.includes('לשנות סבב') ||
    lower.includes('להקדים') ||
    lower.includes('לדחות') ||
    lower.includes('שעה אחרת') ||
    lower.includes('מועד אספקה') ||
    lower.includes('reschedule')
  ) {
    const isEnRoute = order.status === 'בדרך ללקוח' || order.status === 'נמסר באתר';

    if (isEnRoute) {
      const replyText =
        `⚠️ שים לב ${order.clientName}: המשאית של ${order.driver} כבר יצאה מהמחסן ונמצאת כעת בדרך לאתר (${order.destinationAddress}).\n\n` +
        `העברתי בקשה דחופה לראמי מסארוה לבדוק האם הנהג יכול להמתין או לשנות את סדר הפריקות במסלול.\n` +
        `לתיאום ישיר ניתן לחייג לראמי: 050-8860896.`;

      const newRequest: CustomerRequest = {
        id: `req-time-urgent-${Date.now()}`,
        type: 'time_change',
        content: `בקשת שינוי שעת פריקה דחופה בזמן שהמשאית בדרך: "${text}"`,
        timestamp: new Date().toISOString(),
        status: 'pending',
        responseFromNoa: 'הועבר ישירות לראמי לעצירת/תיאום הנהג בשטח',
      };

      const updatedOrder: Order = {
        ...order,
        customerRequests: [...(order.customerRequests || []), newRequest],
        notes: `${order.notes ? order.notes + ' | ' : ''}🕒 בקשת שינוי שעה דחופה מלקוח`,
      };

      return {
        intent: 'change_dropoff_time',
        replyText,
        actionCard: {
          type: 'call_rami',
          title: 'בקשת שינוי שעה הועברה לסדרן',
          details: 'המשאית כבר בנסיעה — ראמי מסארוה עודכן לתיאום מול הנהג',
          badge: 'דחוף ⚠️',
        },
        updatedOrder,
      };
    }

    // Check if user specifically gave a round or time in text
    let parsedTime = '';
    const roundMatch = text.match(/סבב\s*([1-4])/i) || text.match(/round\s*([1-4])/i);
    const hourMatch = text.match(/(\d{1,2}:\d{2})/);
    const morningMatch = lower.includes('בוקר') || lower.includes('morning');
    const noonMatch = lower.includes('צהריים') || lower.includes('noon') || lower.includes('צהרים');
    const afternoonMatch = lower.includes('אחה"צ') || lower.includes('אחר הצהריים') || lower.includes('afternoon');

    if (roundMatch) {
      const num = roundMatch[1];
      parsedTime = num === '1' ? 'סבב 1 (07:30 - בוקר מוקדם)' : num === '2' ? 'סבב 2 (10:00 - בוקר)' : num === '3' ? 'סבב 3 (12:30 - צהריים)' : 'סבב 4 (15:00 - אחה"צ)';
    } else if (hourMatch) {
      parsedTime = `בשעה ${hourMatch[1]}`;
    } else if (morningMatch) {
      parsedTime = 'סבב 1 (בוקר 08:00)';
    } else if (noonMatch) {
      parsedTime = 'סבב 3 (צהריים 12:30)';
    } else if (afternoonMatch) {
      parsedTime = 'סבב 4 (אחה"צ 15:00)';
    }

    if (parsedTime) {
      // User specified time: link back to order and update!
      const newRequest: CustomerRequest = {
        id: `req-time-${Date.now()}`,
        type: 'time_change',
        content: `שינוי שעת פריקה/סבב ל-${parsedTime}`,
        requestedTime: parsedTime,
        timestamp: new Date().toISOString(),
        status: 'pending',
        responseFromNoa: `מועד הפריקה עודכן בסידור ל-${parsedTime}`,
      };

      const updatedOrder: Order = {
        ...order,
        roundAndTime: parsedTime,
        customerRequests: [...(order.customerRequests || []), newRequest],
        notes: `${order.notes ? order.notes + ' | ' : ''}🕒 עודכן מועד אספקה לבקשת הלקוח: ${parsedTime}`,
      };

      const replyText =
        `קיבלתי ועדכנתי בהצלחה! ⏰\n` +
        `שעת הפריקה של הזמנה #${order.orderNumber} שונתה ל: *${parsedTime}*.\n\n` +
        `הודעה מסודרת עודכנה בסידור העבודה של ראמי מסארוה והועברה למחסן לתזמון ההעמסה על המשאית של ${order.driver}.`;

      return {
        intent: 'change_dropoff_time',
        replyText,
        actionCard: {
          type: 'time_changed',
          title: `מועד אספקה עודכן: ${parsedTime}`,
          details: `הזמנה #${order.orderNumber} • סדרן ראמי עודכן במערכת SabanOS`,
          badge: 'עודכן בהצלחה ✅',
        },
        updatedOrder,
      };
    }

    // User asked if they can change without specifying time yet -> offer available rounds
    const replyText =
      `כן, בהחלט ניתן לשנות את מועד האספקה! ⏱️\n` +
      `ההזמנה שלך #${order.orderNumber} מתוכננת כרגע ל: *${order.roundAndTime}*.\n\n` +
      `בחר את הסבב הרצוי או כתוב לי שעה ספציפית:`;

    return {
      intent: 'change_dropoff_time',
      replyText,
      actionCard: {
        type: 'quick_options',
        title: 'בחר מועד אספקה חדש',
        details: 'לחיצה תעדכן ישירות את סידור העבודה של ראמי במחסן',
        options: [
          { label: 'סבב 1 (בוקר 07:30)', actionText: 'אני רוצה להעביר לסבב 1 (07:30)' },
          { label: 'סבב 2 (בוקר 10:00)', actionText: 'אני רוצה להעביר לסבב 2 (10:00)' },
          { label: 'סבב 3 (צהריים 12:30)', actionText: 'אני רוצה להעביר לסבב 3 (12:30)' },
          { label: 'סבב 4 (אחה"צ 15:00)', actionText: 'אני רוצה להעביר לסבב 4 (15:00)' },
        ],
      },
    };
  }

  // 3. INTENT: Add Items ("add 2 more bags to my order", "להוסיף 2 שקים", "תוסיף 3 שקי מלט", etc.)
  if (
    lower.includes('add') ||
    lower.includes('להוסיף') ||
    lower.includes('תוסיף') ||
    lower.includes('הוסף') ||
    lower.includes('תוספת') ||
    lower.includes('עוד שק') ||
    lower.includes('עוד שקים') ||
    lower.includes('עוד בלה') ||
    lower.includes('more bags') ||
    lower.includes('need more')
  ) {
    // Extract item details if mentioned in the query
    // Example regex for "add 2 more bags", "תוסיף 2 שקי מלט", "להוסיף 3 שקים"
    let extractedItems = '';

    // Match patterns like "add 2 more bags", "add 3 bags of cement"
    const engMatch = text.match(/add\s+([\d\w\s]+?)(?:\s+to\s+my\s+order|$)/i);
    // Match patterns like "תוסיף 2 שקי מלט", "להוסיף 2 שקים", "הוסף עוד 3 שקי טיח"
    const hebMatch = text.match(/(?:להוסיף|תוסיף|הוסף)\s+(?:עוד\s+)?([\d\u0590-\u05FF\s\w]+?)(?:\s+להזמנה|$)/);

    if (engMatch && engMatch[1].trim()) {
      extractedItems = engMatch[1].trim();
    } else if (hebMatch && hebMatch[1].trim()) {
      extractedItems = hebMatch[1].trim();
    } else if (lower.includes('2 more bags') || lower.includes('2 bags')) {
      extractedItems = '2 שקי מלט / חומר בניין (2 bags)';
    }

    if (extractedItems) {
      // Direct extraction: Link to order and update!
      const newRequest: CustomerRequest = {
        id: `req-add-${Date.now()}`,
        type: 'addition',
        content: `בקשת תוספת להזמנה #${order.orderNumber}: ${extractedItems}`,
        addedItems: extractedItems,
        timestamp: new Date().toISOString(),
        status: 'pending',
        responseFromNoa: `תוספת "${extractedItems}" עודכנה בסידור והועברה למחסן`,
      };

      const updatedOrder: Order = {
        ...order,
        productsSummary: `${order.productsSummary} + [תוספת לקוח: ${extractedItems}]`,
        customerRequests: [...(order.customerRequests || []), newRequest],
        notes: `${order.notes ? order.notes + ' | ' : ''}➕ תוספת לקוח: ${extractedItems}`,
      };

      const replyText =
        `מעולה! 👏 הוספתי בהצלחה את התוספת להזמנה #${order.orderNumber}:\n` +
        `➕ *פריטים שנוספו:* ${extractedItems}\n\n` +
        `הודעה רשמית שוגרה ישירות למסוף של ראמי מסארוה ולמחסן 4 להעמסה על המשאית של ${order.driver}.\n` +
        `תעודת המשלוח הדיגיטלית שלך עודכנה בהתאם! 📄`;

      return {
        intent: 'add_items',
        replyText,
        actionCard: {
          type: 'addition_confirmed',
          title: `תוספת נקלטה: ${extractedItems}`,
          details: `הזמנה #${order.orderNumber} • סדרן ראמי קיבל התראה במחסן`,
          badge: 'נוסף בהצלחה ✅',
        },
        updatedOrder,
      };
    }

    // Generic add items prompt -> offer options
    const replyText =
      `בשמחה רבה! 🛠️ פתחתי עבורך אפשרות להוספת פריטים להזמנה #${order.orderNumber}.\n` +
      `תוכל לכתוב לי במדויק מה חסר לך (למשל: "הוסף 2 שקי מלט" או "צריך עוד בלה חול") או לבחור פריט נפוץ:`;

    return {
      intent: 'add_items',
      replyText,
      actionCard: {
        type: 'quick_options',
        title: 'תוספות נפוצות להעמסה מיידית',
        details: 'בחירה תעדכן מיידית את תכולת ההזמנה ותישלח לראמי במחסן',
        options: [
          { label: '+ 2 שקי מלט פורטלנד', actionText: 'הוסף 2 שקי מלט פורטלנד להזמנה' },
          { label: '+ 3 שקי טיח חוץ', actionText: 'הוסף 3 שקי טיח חוץ להזמנה' },
          { label: '+ 1 בלה חול מחצבה', actionText: 'הוסף 1 בלה חול מחצבה להזמנה' },
          { label: '+ 5 לוחות גבס לבן', actionText: 'הוסף 5 לוחות גבס לבן להזמנה' },
        ],
      },
    };
  }

  // 4. INTENT: Order Content ("what is in my order", "מה תכולת ההזמנה", etc.)
  if (
    lower.includes('תכול') ||
    lower.includes('מה יש') ||
    lower.includes('מה הזמנתי') ||
    lower.includes('פירוט') ||
    lower.includes('what is in my order') ||
    lower.includes('items in order') ||
    lower.includes('products')
  ) {
    const replyText =
      `הנה תכולת המשלוח הרשמית עבור הזמנה #${order.orderNumber} (${order.clientName}):\n\n` +
      `📦 *מוצרים וכמויות:*\n${order.productsSummary}\n\n` +
      `🛡️ *פקדונות ומשטחים:*\n${order.depositsSummary || 'פטור מפקדונות'}\n\n` +
      `🏭 *מחסן מוצא:* ${order.warehouse || 'מחסן 4 (החרש)'}\n` +
      `📍 *כתובת פריקה:* ${order.destinationAddress}\n\n` +
      `רוצה להוסיף מוצרים נוספים להעמסה זו? פשוט כתוב לי: "הוסף 2 שקים" או כל פריט אחר!`;

    return {
      intent: 'order_content',
      replyText,
    };
  }

  // 5. INTENT: Driver Info ("who is my driver", "מי הנהג", etc.)
  if (
    lower.includes('driver') ||
    lower.includes('נהג') ||
    lower.includes('מי הנהג') ||
    lower.includes('מי מוביל') ||
    lower.includes('טלפון של הנהג') ||
    lower.includes('phone')
  ) {
    const driverName = order.driver || 'צוות חלוקה ח. סבן';
    const driverPhone = order.driver?.includes('חכמת') ? '050-8860897' : order.driver?.includes('עלי') ? '050-8860898' : '050-8860896';

    const replyText =
      `👨‍✈️ *פרטי הנהג המשובץ להזמנה #${order.orderNumber}:*\n\n` +
      `• *שם הנהג:* ${driverName}\n` +
      `• *טלפון ישיר להתקשרות:* ${driverPhone}\n` +
      `• *סדרן ראשי (ראמי מסארוה):* 050-8860896\n` +
      `• *יעד פריקה מתואם:* ${order.destinationAddress}\n\n` +
      `לפני הגעה הנהג יצור קשר טלפוני לתיאום נקודת הפריקה המדויקת בשטח.`;

    return {
      intent: 'driver_info',
      replyText,
      actionCard: {
        type: 'call_rami',
        title: `נהג: ${driverName}`,
        details: `טל' נהג: ${driverPhone} • ראמי סדרן: 050-8860896`,
        badge: 'זמין לשיחה 📞',
      },
    };
  }

  // 6. INTENT: Cancel Order ("cancel my order", "לבטל הזמנה", etc.)
  if (lower.includes('cancel') || lower.includes('ביטול') || lower.includes('לבטל') || lower.includes('בטל')) {
    const isEnRoute = order.status === 'בדרך ללקוח' || order.status === 'נמסר באתר';

    const newRequest: CustomerRequest = {
      id: `req-cancel-${Date.now()}`,
      type: 'cancellation',
      content: `בקשת ביטול מהלקוח ${order.clientName} להזמנה #${order.orderNumber}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      responseFromNoa: isEnRoute ? 'משאית בתנועה - הועבר דחוף לראמי' : 'ההזמנה נעצרה בסידור',
    };

    const updatedOrder: Order = {
      ...order,
      customerRequests: [...(order.customerRequests || []), newRequest],
      notes: `${order.notes ? order.notes + ' | ' : ''}⚠️ בקשת ביטול מלקוח (${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })})`,
    };

    if (isEnRoute) {
      const replyText =
        `⚠️ שים לב: הזמנה #${order.orderNumber} נמצאת כבר בסטטוס "${order.status}" (המשאית בנסיעה או נפרקה).\n\n` +
        `העברתי התראת ביטול דחופה לראמי מסארוה. מומלץ לחייג ישירות לראמי בטלפון: 050-8860896 על מנת לעצור את הנהג מיידית.`;

      return {
        intent: 'cancel_order',
        replyText,
        actionCard: {
          type: 'call_rami',
          title: 'התראת ביטול דחופה',
          details: 'משאית בתנועה — חייג ישירות לראמי 050-8860896',
          badge: 'דחוף ⚠️',
        },
        updatedOrder,
      };
    }

    const replyText =
      `קיבלתי את בקשתך לביטול הזמנה #${order.orderNumber}. 🛑\n\n` +
      `רשמתי את הביטול במערכת SabanOS והעברתי הודעה מיידית לראמי מסארוה ולמחסן לעצור את הליקוט והטעינה.`;

    return {
      intent: 'cancel_order',
      replyText,
      actionCard: {
        type: 'cancellation_pending',
        title: 'בקשת ביטול נקלטה בהצלחה',
        details: 'נשלחה הודעה לראמי מסארוה לעצירת הטעינה במחסן',
        badge: 'בטיפול ⏳',
      },
      updatedOrder,
    };
  }

  // 7. INTENT: Deposits Info ("פקדונות", "בלות", "משטחים")
  if (lower.includes('פקדון') || lower.includes('פקדונות') || lower.includes('בלה') || lower.includes('בלות') || lower.includes('משטח') || lower.includes('deposit')) {
    const replyText =
      `🛡️ *מדיניות פקדונות משטחים ובלות בח. סבן (1994) בע"מ:*\n\n` +
      `• *פיקדון בלה ריקה (מק"ט 60002):* חיוב זמני בתעודה. החזרה לנהג או למחסן מזכה את כרטיס הלקוח באופן מלא.\n` +
      `• *פיקדון משטח עץ (מק"ט 60060):* חיוב זמני. החזרת המשטח השלם מזכה ישירות את החשבון.\n\n` +
      `סטטוס פקדונות בהזמנה זו: *${order.depositsSummary || 'פטור מחיוב פקדון'}*.\n` +
      `בעת פריקת המשאית של ${order.driver}, תוכל למסור לנהג בלות או משטחים ריקים ולקבל אישור זיכוי במקום!`;

    return {
      intent: 'deposits_info',
      replyText,
    };
  }

  // Default: General Query
  return {
    intent: 'general',
    replyText: `תודה על פנייתך לגבי הזמנה #${order.orderNumber} (${order.clientName}). אני נועה AI כאן לשירותך — תוכל לשאול על סטטוס הגעת המשלוח, לבקש שינוי שעת פריקה, או להוסיף מוצרים להזמנה!`,
  };
}
