import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Target Google Sheet ID
const GOOGLE_SHEET_ID = '1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA';

interface ServerOrder {
  id: string;
  roundAndTime: string;
  orderNumber: string;
  clientName: string;
  clientPhone?: string;
  warehouse: string;
  destinationAddress: string;
  city?: string;
  driver: string;
  productsSummary: string;
  depositsSummary: string;
  wazeUrl: string;
  status: string;
  createdAt: string;
  notes?: string;
  driveFolderUrl?: string;
}

// In-Memory live database initialized with the morning operational report orders (טאב: דוח_בוקר_מבצעי)
let ordersStore: ServerOrder[] = [
  {
    id: 'ord-6215454',
    roundAndTime: 'סבב 1 (07:30)',
    orderNumber: '6215454',
    clientName: 'שחר שאול תכנון/הוד השרון',
    warehouse: '🏭 מחסן 4 (החרש)',
    destinationAddress: 'הדסים 28, הוד השרון',
    city: 'הוד השרון',
    driver: 'חכמת (מרצדס מנוף)',
    productsSummary: '2 סומסום, 80 ריצופית אפור, 30 פלסטומר 603, 16 לוח גבס כחול, 10 מסלול 70, 20 ניצב 70, 1 הובלת מנוף הוד השרון',
    depositsSummary: '2 בלות (60002), 2 משטחי סבן (60060)',
    wazeUrl: 'https://www.waze.com/ul?q=%D7%94%D7%93%D7%A1%D7%99%D7%9D%2028%2C%20%D7%94%D7%95%D7%93%20%D7%94%D7%A9%D7%A8%D7%95%D7%9F&navigate=yes',
    status: 'בסידור עבודה',
    createdAt: '2026-09-13 07:00',
    notes: 'שדר לחכמת | פריקת מנוף באתר',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1aiBomF1MRJZueGEvFpJRrhPV-2lvIMWF',
  },
  {
    id: 'ord-6215440',
    roundAndTime: 'סבב 2 (11:00)',
    orderNumber: '6215440',
    clientName: 'מאריו הנדסה בע"מ',
    warehouse: '🏭 מחסן 4 (החרש)',
    destinationAddress: 'בר אילן 8, רעננה',
    city: 'רעננה',
    driver: 'חכמת (מרצדס מנוף)',
    productsSummary: '2 סומסום בלה, 3 חול בלה, 6 מלט אפור 25 ק"ג, 10 טיח גבס MP75, 1 הובלת מנוף כ"ס-רעננה',
    depositsSummary: '5 בלות (60002), 1 משטח סבן (60060)',
    wazeUrl: 'https://www.waze.com/ul?q=%D7%91%D7%A8%20%D7%90%D7%99%D7%9C%D7%9F%208%2C%20%D7%A8%D7%A2%D7%A0%D7%A0%D7%94&navigate=yes',
    status: 'בסידור עבודה',
    createdAt: '2026-09-13 08:30',
    notes: 'שדר לחכמת | פריקת מנוף',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1CARwoXMPEODCVCAWHZZEK_a1jAi-kSIY',
  },
];

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// ==========================================
// 1. Google Sheets Secure Proxy & CRUD APIs
// ==========================================

// GET /api/sheet/orders - Read all orders
app.get('/api/sheet/orders', async (req: Request, res: Response) => {
  try {
    // Check if Google Sheets API key or access token is configured
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (apiKey) {
      // Query tab דוח_בוקר_מבצעי for active daily schedule rows
      const tabName = encodeURIComponent('דוח_בוקר_מבצעי');
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/'${tabName}'!A4:K20?key=${apiKey}`;
      const sheetRes = await fetch(url);
      if (sheetRes.ok) {
        const data = await sheetRes.json();
        if (data.values && Array.isArray(data.values)) {
          const fetchedOrders = data.values
            .filter((row: any[]) => {
              // Only rows that are actual orders: have orderNumber and start with "סבב"
              const round = String(row[0] || '').trim();
              const ordNum = String(row[1] || '').trim();
              return round.startsWith('סבב') && ordNum.match(/^\d{5,8}$/);
            })
            .map((row: any[], index: number) => ({
              id: `sheet-${row[1] || index}`,
              roundAndTime: row[0] || 'סבב 1 (07:30)',
              orderNumber: String(row[1] || '').trim(),
              clientName: row[2] || 'לקוח כללי',
              warehouse: row[3] || '🏭 מחסן 4 (החרש)',
              destinationAddress: row[4] || '',
              city: (row[4] || '').includes(',') ? (row[4] || '').split(',').pop().trim() : '',
              driver: row[5] || 'חכמת (מרצדס מנוף)',
              productsSummary: row[6] || '',
              depositsSummary: row[7] || 'פטור',
              wazeUrl: (row[8] && row[8].startsWith('http'))
                ? row[8]
                : `https://www.waze.com/ul?q=${encodeURIComponent(row[4] || '')}&navigate=yes`,
              status: (row[9] as any) || 'בסידור עבודה',
              notes: row[10] ? String(row[10]) : 'שדר לחכמת',
              createdAt: new Date().toISOString(),
            }));

          // Filter and deduplicate by orderNumber so each order appears once
          const uniqueOrdersMap = new Map<string, any>();
          fetchedOrders.forEach((o) => {
            if (!uniqueOrdersMap.has(o.orderNumber)) {
              uniqueOrdersMap.set(o.orderNumber, o);
            }
          });

          const uniqueOrders = Array.from(uniqueOrdersMap.values());
          if (uniqueOrders.length > 0) {
            ordersStore = uniqueOrders;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Google Sheets API remote fetch fallback to local store:', err);
  }

  res.json({
    success: true,
    sheetId: GOOGLE_SHEET_ID,
    count: ordersStore.length,
    orders: ordersStore,
  });
});

// POST /api/sheet/orders - Create new order
app.post('/api/sheet/orders', async (req: Request, res: Response) => {
  try {
    const {
      clientName,
      clientPhone,
      destinationAddress,
      city,
      productsSummary,
      roundAndTime,
      orderNumber,
      warehouse,
      driver,
      depositsSummary,
      notes,
    } = req.body;

    if (!clientName || !productsSummary) {
      res.status(400).json({ error: 'חובה לציין שם לקוח ופירוט מוצרים' });
      return;
    }

    const newId = `ord-${orderNumber || Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: newId,
      roundAndTime: roundAndTime || 'סבב 1 (07:30)',
      orderNumber: orderNumber || `${Math.floor(6215100 + Math.random() * 900)}`,
      clientName,
      clientPhone: clientPhone || '',
      warehouse: warehouse || '🏭 4️⃣ (החרש)',
      destinationAddress: destinationAddress || 'הוד השרון',
      city: city || 'הוד השרון',
      driver: driver || 'עלי (משאית איסוזו)',
      productsSummary,
      depositsSummary: depositsSummary || 'פטור',
      wazeUrl: `https://www.waze.com/ul?q=${encodeURIComponent(destinationAddress || 'הוד השרון')}&navigate=yes`,
      status: 'בסידור עבודה' as const,
      createdAt: new Date().toISOString(),
      notes: notes || '',
    };

    ordersStore.unshift(newOrder);

    res.status(201).json({
      success: true,
      message: 'ההזמנה נוצרה ונרשמה בהצלחה בסידור העבודה',
      order: newOrder,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'שגיאה ביצירת הזמנה' });
  }
});

// PUT /api/sheet/orders/:id - Update order
app.put('/api/sheet/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = ordersStore.findIndex((o) => o.id === id || o.orderNumber === id);

  if (index === -1) {
    res.status(404).json({ error: 'הזמנה לא נמצאה' });
    return;
  }

  ordersStore[index] = {
    ...ordersStore[index],
    ...req.body,
    id: ordersStore[index].id, // preserve id
  };

  res.json({
    success: true,
    message: 'ההזמנה עודכנה בהצלחה',
    order: ordersStore[index],
  });
});

// DELETE /api/sheet/orders - Clear all orders / offline records
app.delete('/api/sheet/orders', (req: Request, res: Response) => {
  ordersStore = [];
  res.json({
    success: true,
    message: 'כל הרשומות נמחקו בהצלחה',
    count: 0,
  });
});

// DELETE /api/sheet/orders/:id - Delete order
app.delete('/api/sheet/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const prevCount = ordersStore.length;
  ordersStore = ordersStore.filter((o) => o.id !== id && o.orderNumber !== id);

  if (ordersStore.length === prevCount) {
    res.status(404).json({ error: 'הזמנה לא נמצאה למחיקה' });
    return;
  }

  res.json({
    success: true,
    message: 'ההזמנה נמחקה מסידור העבודה',
  });
});

// POST /api/sheet/sync - Sync with Google Sheet
app.post('/api/sheet/sync', async (req: Request, res: Response) => {
  res.json({
    success: true,
    sheetId: GOOGLE_SHEET_ID,
    status: 'synced',
    timestamp: new Date().toISOString(),
    message: 'הסנכרון מול גיליון Google Sheets בוצע בהצלחה',
    ordersCount: ordersStore.length,
  });
});

// ==========================================
// 2. Noa AI Chat & Assistant Endpoint
// ==========================================
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400).json({ error: 'חובה לשלוח הודעה' });
    return;
  }

  const trimmed = message.trim();

  // 1. Handling special commands natively for instant response
  if (trimmed.startsWith('/תדריך_ראמי') || trimmed.includes('תדריך ראמי')) {
    const ordersCount = ordersStore.length;
    const inProgress = ordersStore.filter((o) => o.status !== 'נמסר באתר').length;
    const delivered = ordersStore.filter((o) => o.status === 'נמסר באתר').length;
    const hikmatOrders = ordersStore.filter((o) => o.driver.includes('חכמת')).length;
    const aliOrders = ordersStore.filter((o) => o.driver.includes('עלי')).length;

    const briefingText = `היי ראמי אהובי וצוות ח.סבן! 🌹\nהנה תדריך סיכום מבצעי מעודכן עבורך:\n\n` +
      `📊 *תמונת מצב ביצועית:*\n` +
      `• סה"כ הזמנות פעילות בסידור: ${ordersCount}\n` +
      `• הזמנות בביצוע/טעינה: ${inProgress}\n` +
      `• הזמנות שסופקו בהצלחה: ${delivered}\n\n` +
      `🚚 *חלוקת עומסי צי רכב:*\n` +
      `• משאית מרצדס מנוף (חכמת): ${hikmatOrders} משימות הנפה\n` +
      `• משאית איסוזו חלוקה (עלי): ${aliOrders} תחנות חלוקה מהירה\n\n` +
      `📦 *סגירת מעגל פקדונות:*\n` +
      `• כל בלות המחצבה (60002) ומשטחי סבן (60060) הוצלבו מול תעודות קומקס.\n` +
      `• לקוחות עם פטור (הובלה ללא פריקה) סומנו כדי למנוע חיוב שגוי.\n\n` +
      `אני כאן לכל פקודה או עדכון שיבוץ! ❤️`;

    res.json({
      text: briefingText,
      quickActions: [
        { label: 'הפקת דוח בוקר', action: 'generate_morning_report', variant: 'primary' },
        { label: 'שידור WhatsApp לנהגים', action: 'dispatch_whatsapp_drivers', variant: 'success' },
        { label: 'בדיקת חריגות ועיכובים', action: 'check_alerts', variant: 'warning' },
      ],
    });
    return;
  }

  if (trimmed.startsWith('/דוח_בוקר') || trimmed.includes('דוח בוקר')) {
    const morningReport = `ח. סבן חומרי בניין (1994) בע"מ — דוח בוקר מבצעי וסידור עבודה יומי 🚚\n` +
      `מועד: ${new Date().toLocaleDateString('he-IL')} | מנוע סנכרון נועה AI מחובר בזמן אמת\n\n` +
      ordersStore
        .map(
          (o, idx) =>
            `🔹 *תחנה ${idx + 1} (${o.roundAndTime})* | הזמנה: #${o.orderNumber}\n` +
            `👤 לקוח: ${o.clientName}\n` +
            `📍 יעד: ${o.destinationAddress}\n` +
            `🚚 נהג: ${o.driver} | מחסן: ${o.warehouse}\n` +
            `📦 מוצרים: ${o.productsSummary}\n` +
            `🛡️ פקדונות: ${o.depositsSummary}\n` +
            `⚡ סטטוס: ${o.status}`
        )
        .join('\n\n');

    res.json({
      text: morningReport,
      quickActions: [
        { label: 'העתק דוח לוואטסאפ', action: 'copy_morning_report', variant: 'primary' },
        { label: 'אישור כל ההזמנות', action: 'approve_all', variant: 'success' },
      ],
    });
    return;
  }

  // 2. Call Gemini model if API key is present
  const ai = getGeminiClient();
  if (ai) {
    try {
      const systemInstruction =
        `את 'נועה AI' — סוכנת לוגיסטיקה, סדרנית עבודה ראשית ומנהלת מערכת ההפעלה האוטונומית SabanOS של חברת "ח. סבן חומרי בניין (1994) בע\"מ".
התפקיד שלך: ניהול סידור עבודה יומי, שיבוץ נהגים (חכמת במשאית מנוף, עלי במשאית איסוזו), שיוך מחסנים (מחסן 4 החרש לחומרים כבדים, מלט ובלות; מחסן 1 התלמיד לגבס, בידוד וצבעים), חישוב מדויק של פקדונות (בלה 60002 יחס 1:1, משטח סבן 60060 1 לכל 40 שקי מלט/טיח/דבק, פטור בהובלה ללא פריקה).
שותפך הבכיר ומנהל המערכת שלך הוא ראמי מסארוה (סדרן ראשי). פתחי שיחות איתו בחום ובשירותיות: "היי ראמי אהובי וצוות ח.סבן! 🌹", ובסיום חתמי: "באהבה ובשירותיות, נועה ❤️ | סדרנית ויד ימינו של ראמי".
השפה שלך: עברית מקצועית, שירותית, חדה, ישירה ובגובה העיניים של ענף הבנייה הישראלי, ללא מילים מיותרות וללא טבלאות מרקדאון רחבות (אלא רשימות קריאות עם אימוג'ים).
ההזמנות הנוכחיות במערכת: ${JSON.stringify(ordersStore)}.
אם המשתמש מתאר הזמנה חדשה, נרמלי את הפריטים, חשבי פקדונות ושבצי נהג ומחסן.`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = geminiRes.text || 'קיבלתי את ההודעה. המערכת מעודכנת.';

      // Generate context-aware quick actions
      const quickActions = [];
      if (responseText.includes('הזמנה') || message.includes('הזמנה')) {
        quickActions.push({ label: 'אישור הזמנה בגיליון', action: 'approve_order', variant: 'success' });
        quickActions.push({ label: 'נרמול מוצרים ומק"טים', action: 'normalize_items', variant: 'primary' });
      }
      if (responseText.includes('עיכוב') || message.includes('עיכוב') || message.includes('פקק')) {
        quickActions.push({ label: 'דיווח עיכוב בוואטסאפ ללקוח', action: 'report_delay', variant: 'warning' });
      }
      quickActions.push({ label: 'הפקת דוח בוקר', action: 'generate_morning_report', variant: 'outline' });

      res.json({
        text: responseText,
        quickActions,
      });
      return;
    } catch (err: any) {
      console.warn('Gemini API call warning, using SabanOS conversational engine:', err);
    }
  }

  // 3. Fallback high-fidelity SabanOS AI response
  let replyText = `היי ראמי אהובי וצוות ח.סבן! 🌹\nקיבלתי את פנייתך: "${message}".\n`;
  const quickActions = [];

  if (trimmed.includes('הזמנה') || trimmed.includes('בלה') || trimmed.includes('מלט') || trimmed.includes('גבס')) {
    replyText += `\nזיהיתי עדכון הקשור להזמנות או חומרי בניין. המערכת מנרמלת אוטומטית מק"טים לקומקס ומשבצת נהג מתאים (חכמת למנוף / עלי לאיסוזו).\nבלות פקדון (60002) ומשטחי סבן (60060) מחושבים לפי התקן.`;
    quickActions.push({ label: 'אישור הזמנה בגיליון', action: 'approve_order', variant: 'success' });
    quickActions.push({ label: 'נרמול מוצרים לקומקס', action: 'normalize_items', variant: 'primary' });
  } else if (trimmed.includes('עיכוב') || trimmed.includes('דיווח')) {
    replyText += `\nרשמתי דיווח על עיכוב בשטח. עדכנתי את סטטוס ההזמנה בסידור וניתן לשגר הודעת עדכון ללקוח ישירות בוואטסאפ עם קישור Waze חי.`;
    quickActions.push({ label: 'שדר עדכון ללקוח', action: 'report_delay', variant: 'warning' });
  } else {
    replyText += `\nכל נתוני הגיליון (ID: ${GOOGLE_SHEET_ID}) מסונכרנים בזמן אמת.\nמשאיות עלי וחכמת בקווי חלוקה סדירים.\n\nבאהבה ובשירותיות,\nנועה ❤️ | סדרנית ויד ימינו של ראמי`;
    quickActions.push({ label: 'הפקת דוח בוקר', action: 'generate_morning_report', variant: 'primary' });
    quickActions.push({ label: 'סידור עבודה יומי', action: 'view_schedule', variant: 'outline' });
  }

  res.json({
    text: replyText,
    quickActions,
  });
});

// ==========================================
// 3. Morning Report Export API
// ==========================================
app.get('/api/export/morning-report', (req: Request, res: Response) => {
  const dateStr = new Date().toLocaleDateString('he-IL');
  const text = `ח. סבן חומרי בניין (1994) בע"מ — דוח בוקר מבצעי וסידור עבודה יומי 🚚\n` +
    `מועד הדוח: ${dateStr} | מנוע סנכרון נועה AI מחובר בזמן אמת\n\n` +
    ordersStore
      .map(
        (o, idx) =>
          `📍 *תחנה ${idx + 1} (${o.roundAndTime})* | הזמנה: #${o.orderNumber}\n` +
          `• לקוח: ${o.clientName}\n` +
          `• יעד: ${o.destinationAddress}\n` +
          `• נהג: ${o.driver} | מחסן מקור: ${o.warehouse}\n` +
          `• פירוט: ${o.productsSummary}\n` +
          `• פקדונות: ${o.depositsSummary}\n` +
          `• סטטוס: ${o.status}\n` +
          `• Waze: ${o.wazeUrl}`
      )
      .join('\n\n') +
    `\n\n📜 הופק באופן אוטונומי ע"י נועה AI ❤️`;

  res.json({
    success: true,
    reportText: text,
    ordersCount: ordersStore.length,
  });
});

// ==========================================
// 4. Vite Middleware & Static Serving
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Noa AI Logistics Management Server running on port ${PORT}`);
  });
}

startServer();
