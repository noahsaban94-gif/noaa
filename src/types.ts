/**
 * types.ts
 * הגדרות טיפוסים עבור מערכת ההפעלה הלוגיסטית נועה AI (SabanOS)
 * ח. סבן חומרי בניין (1994) בע"מ
 */

export type OrderStatus =
  | 'בסידור עבודה'
  | 'מוכן להעמסה'
  | 'בטעינה במחסן'
  | 'בדרך ללקוח'
  | 'נמסר באתר'
  | 'חריגה / עיכוב';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  type?: 'bigbag' | 'bag' | 'block' | 'drywall' | 'crane' | 'unloaded_transport' | 'general';
}

export interface Order {
  id: string;
  roundAndTime: string; // למשל: סבב 1 (07:30)
  orderNumber: string; // מספר הזמנה בקומקס, למשל: 6215184
  clientName: string;
  clientPhone?: string;
  warehouse: '🏟️ 1️⃣ (התלמיד)' | '🏭 4️⃣ (החרש)' | string;
  destinationAddress: string;
  city?: string;
  driver: 'עלי (משאית איסוזו)' | 'חכמת (מרצדס מנוף)' | string;
  productsSummary: string; // פירוט מוצרים וכמויות
  depositsSummary: string; // פקדונות (בלות/משטחים) או "פטור"
  wazeUrl: string;
  status: OrderStatus;
  whatsappMessage?: string;
  createdAt: string;
  notes?: string;
  items?: OrderItem[];
  driveFolderUrl?: string;
}

export interface Driver {
  id: string;
  name: string;
  title: string;
  truckModel: string;
  licensePlate: string;
  phone: string;
  craneCapability: boolean;
  activeOrdersCount: number;
  status: 'active' | 'loading' | 'on_road' | 'break';
  currentLocation?: string;
}

export interface MorningReport {
  date: string;
  closingTime: string;
  totalOrders: number;
  hareshOrders: number;
  talmidOrders: number;
  craneOrders: number;
  isuzuOrders: number;
  totalBigBags: number;
  totalWoodPallets: number;
  status: string;
  recordedBy: string;
}

export interface QuickAction {
  label: string;
  action: string;
  variant?: 'default' | 'primary' | 'warning' | 'success' | 'outline';
  payload?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'noa' | 'system';
  text: string;
  timestamp: string;
  quickActions?: QuickAction[];
  orderData?: Partial<Order>;
  hasAudio?: boolean;
}

export interface ClientProfile {
  id: number | string;
  name: string;
  phone: string;
  altPhone?: string;
  comaxId?: string;
  comaxCardName?: string;
  contactPerson: string;
  address: string;
  city: string;
  defaultDriver: string;
  defaultWarehouse: string;
  driveFolderUrl?: string;
  projects?: string[];
}

export type Client = ClientProfile;

export interface CatalogProduct {
  sku: string;
  name: string;
  deposits: {
    bela: boolean;
    pallet: boolean;
    barrel: boolean;
    blockPallet: boolean;
  };
}

export type ActiveTab = 'dashboard' | 'schedule' | 'chat' | 'clients' | 'deposits' | 'settings';
