import { Order } from '../types';

export interface FemaleVoiceOption {
  id: string;
  name: string;
  systemVoiceURI?: string;
  description: string;
  pitch: number;
  rate: number;
  isSystemVoice: boolean;
  isRecommended?: boolean;
}

export interface VoiceSummaryScript {
  fullText: string;
  sections: {
    title: string;
    text: string;
  }[];
}

/**
 * Curated Hebrew female voice profiles tailored for natural, warm, and operational delivery.
 */
export const CURATED_FEMALE_VOICE_PRESETS: FemaleVoiceOption[] = [
  {
    id: 'noa-warm',
    name: 'נועה AI — צליל נשי טבעי וחם (מומלץ)',
    description: 'טון רך, ברור ושירותי, אידיאלי לתדריך בוקר',
    pitch: 1.2,
    rate: 1.0,
    isSystemVoice: false,
    isRecommended: true,
  },
  {
    id: 'noa-clear',
    name: 'נועה AI — חמ"ל לוגיסטי ודיבוב רשמי',
    description: 'הגייה חדה, מדויקת ועסקית עם דגש על שמות יעדים',
    pitch: 1.12,
    rate: 1.05,
    isSystemVoice: false,
  },
  {
    id: 'noa-calm',
    name: 'נועה AI — נימה רגועה ומתונה',
    description: 'קצב נינוח להאזנה בריכוז תוך כדי נהיגה או בדיקת הזמנות',
    pitch: 1.08,
    rate: 0.92,
    isSystemVoice: false,
  },
  {
    id: 'noa-speedy',
    name: 'נועה AI — סקירה מהירה וממוקדת (זריז)',
    description: 'קצב מהיר למנהלי עבודה בלחץ זמנים',
    pitch: 1.18,
    rate: 1.22,
    isSystemVoice: false,
  },
];

/**
 * Detect available Hebrew voices from browser SpeechSynthesis
 */
export function getAvailableHebrewVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices() || [];
  return voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return (
      lang.startsWith('he') ||
      lang.includes('il') ||
      name.includes('hebrew') ||
      name.includes('עברית') ||
      name.includes('carmit') ||
      name.includes('hila')
    );
  });
}

/**
 * Check if a voice name is likely female
 */
export function isLikelyFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  const femaleKeywords = [
    'female',
    'carmit',
    'hila',
    'sara',
    'sarah',
    'tamar',
    'noa',
    'ayelet',
    'shoshana',
    'zira',
    'he-il',
  ];
  return femaleKeywords.some((kw) => name.includes(kw));
}

/**
 * Generates an articulate, spoken Hebrew transcript tailored specifically
 * for vocal reading to the logistics manager (stripping URLs, formatting codes, and abbreviations).
 */
export function generateVoiceSummaryScript(
  orders: Order[],
  dateStr: string
): VoiceSummaryScript {
  const sections: { title: string; text: string }[] = [];

  // 1. Introduction & Overview
  const totalCount = orders.length;
  const urgentOrders = orders.filter(
    (o) =>
      o.status === 'חריגה / עיכוב' ||
      (o.notes && (o.notes.includes('דחוף') || o.notes.includes('בהקדם'))) ||
      (o.roundAndTime && (o.roundAndTime.includes('דחוף') || o.roundAndTime.includes('סבב 1')))
  );

  const introText =
    `בוקר טוב מנהל יקר. כאן נועה AI עם תדריך הבוקר הלוגיסטי של חברת ח. סבן לחומרי בניין. ` +
    `להיום, ${dateStr}, משובצות בסידור העבודה סך הכל ${totalCount} משימות אספקה. ` +
    (urgentOrders.length > 0
      ? `שימו לב: ישנן ${urgentOrders.length} משימות דחופות עם עדיפות יציאה מוקדמת.`
      : `תנועת האספקות צפויה להתנהל לפי לוח הזמנים המתוכנן.`);

  sections.push({
    title: 'סקירת פתיחה',
    text: introText,
  });

  // 2. Driver 1 - Hikmat (Mercedes Crane Truck)
  const hikmatOrders = orders.filter((o) => o.driver.includes('חכמת'));
  if (hikmatOrders.length > 0) {
    let hikmatText = `חלוקה למשאית מנוף: הנהג חכמת משובץ ל-${hikmatOrders.length} אספקות. `;
    hikmatOrders.forEach((o, i) => {
      const cleanAddress = o.destinationAddress.replace(/,.*$/, '');
      hikmatText += `תחנה מספר ${i + 1}: אצל הלקוח ${o.clientName}, ביעד ${cleanAddress}, פריקה באמצעות מנוף של ${o.productsSummary}. `;
      if (o.notes) {
        hikmatText += `דגש: ${o.notes}. `;
      }
    });
    sections.push({
      title: 'חכמת — משאית מנוף',
      text: hikmatText,
    });
  }

  // 3. Driver 2 - Ali (Isuzu Truck)
  const aliOrders = orders.filter((o) => o.driver.includes('עלי'));
  if (aliOrders.length > 0) {
    let aliText = `חלוקה למשאית איסוזו: הנהג עלי משובץ ל-${aliOrders.length} אספקות. `;
    aliOrders.forEach((o, i) => {
      const cleanAddress = o.destinationAddress.replace(/,.*$/, '');
      aliText += `תחנה מספר ${i + 1}: אצל הלקוח ${o.clientName}, ביעד ${cleanAddress}, מוצרים: ${o.productsSummary}. `;
      if (o.notes) {
        aliText += `הערה: ${o.notes}. `;
      }
    });
    sections.push({
      title: 'עלי — משאית איסוזו',
      text: aliText,
    });
  }

  // 4. Other drivers (if any)
  const otherOrders = orders.filter(
    (o) => !o.driver.includes('חכמת') && !o.driver.includes('עלי')
  );
  if (otherOrders.length > 0) {
    let otherText = `בנוסף קיימות ${otherOrders.length} אספקות נוספות: `;
    otherOrders.forEach((o, i) => {
      otherText += `משלוח מספר ${i + 1} עבור ${o.clientName} ליעד ${o.destinationAddress}, נהג: ${o.driver}. `;
    });
    sections.push({
      title: 'אספקות נוספות',
      text: otherText,
    });
  }

  // 5. Deposits & Warehouse Logistics
  const depositsOrders = orders.filter(
    (o) =>
      o.depositsSummary &&
      !o.depositsSummary.includes('ללא') &&
      (o.depositsSummary.includes('משטח') || o.depositsSummary.includes('בלה') || o.depositsSummary.includes('שרוול'))
  );

  let operationalText = 'דגשים מבצעיים למחסנאים ולנהגים: ';
  if (depositsOrders.length > 0) {
    operationalText += `יש להקפיד על איסוף והחתמת פקדונות אצל הלקוחות ב-${depositsOrders.length} יעדים, כולל החזרת משטחים ובלות למחסן 4 החרש. `;
  } else {
    operationalText += `כל הפקדונות מאוזנים. `;
  }

  const warehouse4Count = orders.filter((o) => o.warehouse.includes('4') || o.warehouse.includes('חרש')).length;
  const warehouse1Count = orders.filter((o) => o.warehouse.includes('1') || o.warehouse.includes('תלמיד')).length;

  if (warehouse4Count > 0 || warehouse1Count > 0) {
    operationalText += `העמסות: ${warehouse4Count} משימות יוצאות ממחסן 4 החרש, ו-${warehouse1Count} משימות ממחסן 1 התלמיד. `;
  }

  operationalText += `נועה AI מאחלת לצוות ח. סבן נסיעה בטוחה ויום עבודה מוצלח ומסודר!`;

  sections.push({
    title: 'דגשי פקדונות והעמסה',
    text: operationalText,
  });

  const fullText = sections.map((s) => `${s.title}: ${s.text}`).join('\n\n');

  return {
    fullText,
    sections,
  };
}
