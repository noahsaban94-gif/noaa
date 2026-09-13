/**
 * normalizer.ts
 * מנוע נרמול פריטים, שיוך מחסן, שיבוץ נהג וחישוב פקדונות אוטומטי
 * ח. סבן חומרי בניין (1994) בע"מ
 */

export interface NormalizedResult {
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    type: string;
  }>;
  deposits: {
    bigBags: number;
    woodPallets: number;
    blockPallets: number;
    depositSummary: string;
  };
  recommendedDriver: 'עלי (משאית איסוזו)' | 'חכמת (מרצדס מנוף)';
  recommendedWarehouse: '🏟️ 1️⃣ (התלמיד)' | '🏭 4️⃣ (החרש)';
  requiresCrane: boolean;
  isExempt: boolean;
}

interface CatalogEntry {
  match: RegExp;
  sku: string;
  name: string;
  type: 'bigbag' | 'bag' | 'block' | 'drywall' | 'profile' | 'crane' | 'unloaded_transport' | 'chemical' | 'general';
  perPallet?: number;
  warehouse: '1' | '4';
}

const CATALOG_RULES: CatalogEntry[] = [
  // מחסן 4 - מלט, חול, טיט, סומסום, חצץ, בלוקים
  { match: /מלט\s*אפור/i, sku: '10002', name: 'מלט אפור 25 ק"ג', type: 'bag', perPallet: 40, warehouse: '4' },
  { match: /מלט\s*לבן/i, sku: '10009', name: 'מלט לבן 25 ק"ג', type: 'bag', perPallet: 40, warehouse: '4' },
  { match: /חול\s*(שק\s*גדול|בלה|בלות)/i, sku: '11501', name: 'חול שק גדול (בלה)', type: 'bigbag', warehouse: '4' },
  { match: /חול\s*שק/i, sku: '11500', name: 'חול שק 25 ק"ג', type: 'bag', perPallet: 70, warehouse: '4' },
  { match: /סומסום\s*(שק\s*גדול|בלה|בלות)/i, sku: '11511', name: 'סומסום שק גדול (בלה)', type: 'bigbag', warehouse: '4' },
  { match: /סומסום\s*שק/i, sku: '11510', name: 'סומסום שק 25 ק"ג', type: 'bag', perPallet: 70, warehouse: '4' },
  { match: /טיט\s*(שק\s*גדול|מוכן\s*שק\s*גדול|בלה|בלות)/i, sku: '11551', name: 'טיט שק גדול (בלה)', type: 'bigbag', warehouse: '4' },
  { match: /טיט\s*שק/i, sku: '11550', name: 'טיט מוכן שק 25 ק"ג', type: 'bag', perPallet: 70, warehouse: '4' },
  { match: /חצץ\s*(שק\s*גדול|בלה|בלות)/i, sku: '11506', name: 'חצץ שק גדול (בלה)', type: 'bigbag', warehouse: '4' },
  { match: /חמרה\s*(שק\s*גדול|בלה|בלות)/i, sku: '11570', name: 'חמרה שק גדול (בלה)', type: 'bigbag', warehouse: '4' },
  { match: /מצע\s*(שק\s*גדול|בלה|בלות)/i, sku: '11540', name: 'מצע שק גדול (בלה)', type: 'bigbag', warehouse: '4' },
  { match: /בלוק\s*10/i, sku: '12010', name: 'בלוק בטון 10/20/40', type: 'block', perPallet: 90, warehouse: '4' },
  { match: /בלוק\s*20/i, sku: '12204', name: 'בלוק בטון 20/20/40 4 חורים', type: 'block', perPallet: 75, warehouse: '4' },
  { match: /פומיס/i, sku: '122102040', name: 'פומיס בניה 10/20/40', type: 'block', perPallet: 90, warehouse: '4' },

  // דבקים ואיטום
  { match: /דבק\s*116|116\s*לבן/i, sku: '15116', name: 'דבק 116 לבן 25 ק"ג כרמית', type: 'bag', perPallet: 40, warehouse: '4' },
  { match: /דבק\s*603|פלסטומר\s*603/i, sku: '14603', name: 'פלסטומר AD603 אפור 25 ק"ג', type: 'bag', perPallet: 40, warehouse: '4' },
  { match: /דבק\s*109/i, sku: '15109', name: 'דבק 109 25 ק"ג כרמית', type: 'bag', perPallet: 40, warehouse: '4' },
  { match: /ריצופית\s*181/i, sku: '15181', name: 'ריצופית אפור 181 25 ק"ג', type: 'bag', perPallet: 40, warehouse: '4' },
  { match: /טיח\s*ממ"?ד/i, sku: '15770', name: 'טיח ממ"ד 25 ק"ג', type: 'bag', perPallet: 40, warehouse: '4' },
  { match: /סיקה\s*107/i, sku: '19108', name: 'סיקה 107 לבן+תוסף 25 ק"ג', type: 'chemical', perPallet: 40, warehouse: '4' },
  { match: /רוקבונד/i, sku: '15090', name: 'רוקבונד 28 ק"ג', type: 'bag', warehouse: '4' },

  // מחסן 1 - גבס, פרופילים, בידוד וצבע
  { match: /לוח\s*גבס\s*לבן\s*260|גבס\s*לבן\s*260/i, sku: '111260', name: 'לוח גבס לבן 260 ע 12.50', type: 'drywall', warehouse: '1' },
  { match: /לוח\s*גבס\s*לבן\s*200|גבס\s*לבן\s*200/i, sku: '111200', name: 'לוח גבס לבן 200 ע 12.50', type: 'drywall', warehouse: '1' },
  { match: /לוח\s*גבס\s*לבן\s*300|גבס\s*לבן\s*300/i, sku: '111300', name: 'לוח גבס לבן 300 ע 12.50', type: 'drywall', warehouse: '1' },
  { match: /לוח\s*גבס\s*ירוק|גבס\s*ירוק/i, sku: '112260', name: 'לוח גבס ירוק 260 ע 12.50', type: 'drywall', warehouse: '1' },
  { match: /לוח\s*גבס\s*כחול|גבס\s*כחול/i, sku: '114260', name: 'לוח גבס כחול 260 ע 12.50', type: 'drywall', warehouse: '1' },
  { match: /לוח\s*גבס\s*4K|גבס\s*4K/i, sku: '116260', name: 'לוח גבס 4K ירוק 260', type: 'drywall', warehouse: '1' },
  { match: /ניצב\s*70/i, sku: '9570300', name: 'ניצב 0.5 70/300', type: 'profile', warehouse: '1' },
  { match: /ניצב\s*50/i, sku: '9550300', name: 'ניצב 0.5 50/300', type: 'profile', warehouse: '1' },
  { match: /מסלול\s*70/i, sku: '8570300', name: 'מסלול 0.5 70/300', type: 'profile', warehouse: '1' },
  { match: /מסלול\s*50/i, sku: '8550300', name: 'מסלול 0.5 50/300', type: 'profile', warehouse: '1' },
  { match: /בידוד|צמר/i, sku: '76010', name: 'בידוד מינרלי 12 ק"ג', type: 'drywall', warehouse: '1' },
  { match: /שפכטל/i, sku: '14227', name: 'שפכטל מוכן', type: 'bag', warehouse: '1' },
  { match: /בורג\s*גבס|ברגי\s*גבס/i, sku: '76206', name: 'בורג גבס 25 1000 יח', type: 'drywall', warehouse: '1' },
  { match: /פחפח/i, sku: '76133', name: 'בורג פחפח 13 1000 יח', type: 'drywall', warehouse: '1' },

  // הובלות ומנוף
  { match: /מנוף|הובלת\s*מנוף/i, sku: '18050', name: 'הובלת מנוף', type: 'crane', warehouse: '4' },
  { match: /ללא\s*פריקה/i, sku: '818050', name: 'הובלה ללא פריקה', type: 'unloaded_transport', warehouse: '1' }
];

export function normalizeOrderText(rawText: string): NormalizedResult {
  const lines = rawText.split(/\n|,|\+|\band\b/i);
  const parsedItems: NormalizedResult['items'] = [];

  let totalBigBags = 0;
  let totalSmallBags = 0;
  let blockPallets = 0;
  let hasCrane = false;
  let isExempt = false;
  let hareshWeight = 0;
  let talmidWeight = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // חילוץ כמות מספרית (למשל: 5 בלות, 30 שקי, 50 לוחות)
    const qtyMatch = trimmed.match(/(\d+(\.\d+)?)/);
    const quantity = qtyMatch ? parseFloat(qtyMatch[0]) : 1;

    const matched = CATALOG_RULES.find((rule) => rule.match.test(trimmed));

    if (matched) {
      parsedItems.push({
        sku: matched.sku,
        name: matched.name,
        quantity,
        type: matched.type,
      });

      if (matched.warehouse === '4') hareshWeight += quantity;
      if (matched.warehouse === '1') talmidWeight += quantity;

      if (matched.type === 'bigbag') {
        totalBigBags += quantity;
      } else if (matched.type === 'bag') {
        totalSmallBags += quantity;
      } else if (matched.type === 'block') {
        blockPallets += Math.ceil(quantity / (matched.perPallet || 75));
      } else if (matched.type === 'crane') {
        hasCrane = true;
      } else if (matched.type === 'unloaded_transport') {
        isExempt = true;
      }
    } else {
      // פריט כללי
      parsedItems.push({
        sku: 'כללי',
        name: trimmed,
        quantity,
        type: 'general',
      });
      hareshWeight += quantity;
    }
  });

  // חישוב משטחי סבן (משטח עץ לכל 40 שקי מלט/טיח/דבק)
  const woodPallets = totalSmallBags >= 20 ? Math.ceil(totalSmallBags / 40) : (totalSmallBags > 0 ? 1 : 0);

  // בדיקת פטור (ללא פריקה, או מוצרי גבס/ברגים בלבד)
  if (
    isExempt ||
    (totalBigBags === 0 && totalSmallBags === 0 && blockPallets === 0)
  ) {
    isExempt = true;
  }

  // מחרוזת סיכום פקדונות
  let depositSummary = 'פטור';
  if (!isExempt) {
    const parts: string[] = [];
    if (totalBigBags > 0) parts.push(`${totalBigBags} בלות (60002)`);
    if (woodPallets > 0) parts.push(`${woodPallets} משטחי סבן (60060)`);
    if (blockPallets > 0) parts.push(`${blockPallets} משטחי בלוקים (60006)`);
    depositSummary = parts.length > 0 ? parts.join(', ') : 'פטור';
  }

  // שיבוץ נהג מומלץ
  const requiresCrane = hasCrane || totalBigBags > 0 || blockPallets > 0 || woodPallets >= 2;
  const recommendedDriver: 'עלי (משאית איסוזו)' | 'חכמת (מרצדס מנוף)' = requiresCrane
    ? 'חכמת (מרצדס מנוף)'
    : 'עלי (משאית איסוזו)';

  // שיוך מחסן מקור מומלץ
  const recommendedWarehouse: '🏟️ 1️⃣ (התלמיד)' | '🏭 4️⃣ (החרש)' =
    talmidWeight > hareshWeight && totalBigBags === 0 && blockPallets === 0
      ? '🏟️ 1️⃣ (התלמיד)'
      : '🏭 4️⃣ (החרש)';

  return {
    items: parsedItems,
    deposits: {
      bigBags: totalBigBags,
      woodPallets,
      blockPallets,
      depositSummary,
    },
    recommendedDriver,
    recommendedWarehouse,
    requiresCrane,
    isExempt,
  };
}
