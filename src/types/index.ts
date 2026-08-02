export type Unit = 'pc' | 'kg' | 'g' | 'l' | 'ml' | 'box' | 'pack';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'store' | 'shop' | 'other';
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  supplierId: string | null;
  costPrice: number;
  sellingPrice: number;
  taxRate: number; // percent
  unit: Unit;
  stockByLocation: Record<string, number>;
  reorderLevel: number;
  batchNumber: string;
  expiryDate: string | null;
  imageUrl: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockLogEntry {
  id: string;
  productId: string;
  locationId: string | null;
  type: 'receive' | 'adjust-increase' | 'adjust-decrease' | 'sale' | 'transfer-out' | 'transfer-in' | 'initial' | 'po-receive';
  quantity: number;
  reason?: string;
  reference?: string;
  createdAt: string;
  resultingStock: number;
}

export interface StockTransfer {
  id: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  reason: string;
  transferredBy: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  rewardPoints: number;
  debtBalance: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  productIds: string[];
  balance: number;
  createdAt: string;
}

export type POStatus = 'pending' | 'delivered' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PurchaseOrderItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  status: POStatus;
  approvalStatus: ApprovalStatus;
  createdBy: string | null;
  approvedBy: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

export type MobileProvider = 'TELEBIRR' | 'CBE' | 'BOA';
export type PaymentMethod = 'cash' | 'card' | 'mobile-money' | 'split';

export interface SplitPaymentPart {
  method: 'cash' | 'card' | 'mobile-money';
  amount: number;
  mobileProvider?: MobileProvider;
}

export interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number; // possibly manually overridden
  originalPrice: number;
  taxRate: number;
  lineDiscount: number;
}

export type SaleStatus = 'completed' | 'refunded' | 'partially-refunded';

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  cashier: string;
  locationId: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discountType: 'amount' | 'percent';
  couponCode: string | null;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  mobileProvider: MobileProvider | null;
  splitPayments: SplitPaymentPart[] | null;
  status: SaleStatus;
  createdAt: string;
}

export type ExpenseCategory = 'Utilities' | 'Salary' | 'Transport' | 'Rent' | 'Marketing' | 'Other';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  notes: string;
  approvalStatus: ApprovalStatus;
  createdBy: string | null;
  approvedBy: string | null;
  createdAt: string;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  logoUrl: string | null;
  currency: string;
  currencySymbol: string;
  language: string;
  defaultTaxRate: number;
  receiptFooter: string;
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
}

export interface CartLine {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  taxRate: number;
  lineDiscount: number;
  stock: number;
}

// ---- Users, roles & permissions ----

export type UserRole = 'admin' | 'manager' | 'finance' | 'cashier' | 'inventory_clerk';

export type Permission =
  | 'dashboard.view'
  | 'pos.use'
  | 'products.view'
  | 'products.manage'
  | 'categories.manage'
  | 'inventory.manage'
  | 'transfers.manage'
  | 'locations.manage'
  | 'customers.manage'
  | 'suppliers.manage'
  | 'purchaseOrders.manage'
  | 'purchaseOrders.approve'
  | 'salesHistory.view'
  | 'salesHistory.refund'
  | 'expenses.manage'
  | 'expenses.approve'
  | 'reports.view'
  | 'analytics.view'
  | 'finance.view'
  | 'settings.manage'
  | 'users.manage';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  grantedPermissions: Permission[];
  revokedPermissions: Permission[];
  active: boolean;
  avatarUrl: string | null;
  createdAt: string;
}
