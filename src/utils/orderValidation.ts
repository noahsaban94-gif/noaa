import { Order, OrderItem } from '../types';

export interface BelaDepositAlertResult {
  hasAlert: boolean;
  reason?: string;
  detectedBagsCount?: number;
  suggestedDeposit?: string;
  isExempt: boolean;
  isEmpty: boolean;
  missingBagsInDeposit: boolean;
}

/**
 * Checks if an order's products or notes mention "בלות" (big bags / bulk bags of sand, gravel, sesame, etc.),
 * but the deposits field is marked as 'פטור' (exempt), empty, or missing the bag deposit (מק"ט 60002).
 * Designed to prevent billing errors and pallet threshold issues (טעויות חיוב / מינימום סף משטח).
 */
export function checkBelaDepositAlert(order: Partial<Order> | {
  productsSummary?: string;
  depositsSummary?: string;
  notes?: string;
  items?: OrderItem[];
}): BelaDepositAlertResult {
  const productsText = (order.productsSummary || '').trim();
  const notesText = (order.notes || '').trim();
  const depositsText = (order.depositsSummary || '').trim();
  const combinedProducts = `${productsText} ${notesText}`;

  // 1. Check if order includes 'בלות' (big bags)
  // Ensure we do NOT false-match transport terms like הובלה, הובלות, הובלת מנוף, or בלוק, בלוקים
  const sanitized = combinedProducts
    .replace(/הובל[התותים]*/g, ' ')
    .replace(/בלוק[ים]*/g, ' ')
    .replace(/טבל[התות]*/g, ' ');

  // Match standalone בלה / בלות / ביג באג / ביגבג, or attached Hebrew prefixes (הבלה, והבלות, לבלות)
  const bagPattern = /(?:^|[\s,.\-+#/()0-9])([וכבלהמ]?בלה|[וכבלהמ]?בלות|ביג\s*ב[אג]|ביגבג)(?:[\s,.\-+#/()]|$)/i;
  
  // Common product phrasing like "2 סומסום בלה", "3 חול בלה", "טיט בלה", "חצץ בלה"
  const materialBagPattern = /(חול|סומסום|טיט|חצץ|אגרגט|טוף|חמרה|מחצבה)\s+בלה/i;
  const bagMaterialPattern = /בלה\s+(חול|סומסום|טיט|חצץ|אגרגט|טוף|חמרה)/i;
  const numberedBagsPattern = /(\d+)\s*(?:שקי\s*)?בלות/i;

  const hasItemsBags = order.items && order.items.some(
    it => it.type === 'bigbag' || /(בלה|בלות|ביג\s*ב[אג])/i.test(it.name)
  );

  const includesBags = Boolean(
    hasItemsBags ||
    bagPattern.test(sanitized) ||
    materialBagPattern.test(combinedProducts) ||
    bagMaterialPattern.test(combinedProducts) ||
    numberedBagsPattern.test(combinedProducts)
  );

  if (!includesBags) {
    return {
      hasAlert: false,
      isExempt: false,
      isEmpty: false,
      missingBagsInDeposit: false,
    };
  }

  // Extract bag quantity estimate if possible
  let detectedBagsCount: number | undefined;
  const matchNumbered = sanitized.match(/(\d+)\s*(?:שקי\s*)?בלות/i) ||
    sanitized.match(/(\d+)\s*(?:סומסום|חול|טיט|חצץ|אגרגט|טוף)?\s*בלה/i);
  if (matchNumbered && matchNumbered[1]) {
    detectedBagsCount = parseInt(matchNumbered[1], 10);
  }

  // 2. Check deposits status
  const isEmpty = !depositsText || depositsText === '-' || depositsText === 'ריק';
  const isExempt = depositsText === 'פטור' || depositsText.includes('פטור') || depositsText === 'ללא' || depositsText === 'אין';
  
  // Also check if deposits only mention pallets (משטחים / 60060) without charging for bags (60002 / בלות)
  const mentionsBagsInDeposit = /(בלה|בלות|60002)/i.test(depositsText);
  const missingBagsInDeposit = !mentionsBagsInDeposit && (isExempt || isEmpty || /(משטח|60060)/.test(depositsText));

  const hasAlert = isExempt || isEmpty || !mentionsBagsInDeposit;

  let reason = '';
  if (isExempt) {
    reason = 'ההזמנה כוללת שקי בלה אך שדה הפיקדונות מסומן כ"פטור"';
  } else if (isEmpty) {
    reason = 'ההזמנה כוללת שקי בלה אך שדה הפיקדונות ריק';
  } else if (!mentionsBagsInDeposit) {
    reason = 'ההזמנה כוללת שקי בלה אך אין חיוב פיקדון בלה (מק"ט 60002)';
  }

  const suggestedBags = detectedBagsCount ? `${detectedBagsCount} בלות (60002)` : 'בלות (60002)';
  const suggestedDeposit = depositsText && !isExempt && !isEmpty
    ? `${suggestedBags}, ${depositsText}`
    : suggestedBags;

  return {
    hasAlert,
    reason,
    detectedBagsCount,
    suggestedDeposit,
    isExempt,
    isEmpty,
    missingBagsInDeposit,
  };
}
