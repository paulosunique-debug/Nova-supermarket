import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartLine, MobileProvider, PaymentMethod, SplitPaymentPart } from '../types';

interface CartState {
  lines: CartLine[];
  customerId: string | null;
  locationId: string | null;
  discount: number;
  discountType: 'amount' | 'percent';
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  mobileProvider: MobileProvider | null;
  splitPayments: SplitPaymentPart[];
  amountTendered: number;
  addProduct: (line: Omit<CartLine, 'quantity'>) => void;
  incrementLine: (productId: string) => void;
  decrementLine: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  setLinePrice: (productId: string, price: number) => void;
  removeLine: (productId: string) => void;
  setCustomer: (id: string | null) => void;
  setLocation: (id: string | null) => void;
  setDiscount: (value: number, type: 'amount' | 'percent') => void;
  setCoupon: (code: string | null) => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  setMobileProvider: (p: MobileProvider | null) => void;
  setSplitPayments: (parts: SplitPaymentPart[]) => void;
  setAmountTendered: (n: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      customerId: null,
      locationId: null,
      discount: 0,
      discountType: 'amount',
      couponCode: null,
      paymentMethod: 'cash',
      mobileProvider: null,
      splitPayments: [],
      amountTendered: 0,
      addProduct: (line) => {
        const existing = get().lines.find((l) => l.productId === line.productId);
        if (existing) {
          set((s) => ({
            lines: s.lines.map((l) => (l.productId === line.productId ? { ...l, quantity: l.quantity + 1 } : l))
          }));
        } else {
          set((s) => ({ lines: [...s.lines, { ...line, quantity: 1 }] }));
        }
      },
      incrementLine: (productId) =>
        set((s) => ({ lines: s.lines.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l)) })),
      decrementLine: (productId) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity - 1 } : l))
            .filter((l) => l.quantity > 0)
        })),
      setQuantity: (productId, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, qty) } : l)).filter((l) => l.quantity > 0)
        })),
      setLinePrice: (productId, price) =>
        set((s) => ({ lines: s.lines.map((l) => (l.productId === productId ? { ...l, unitPrice: price } : l)) })),
      removeLine: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      setCustomer: (id) => set({ customerId: id }),
      setLocation: (id) => set({ locationId: id }),
      setDiscount: (value, type) => set({ discount: value, discountType: type }),
      setCoupon: (code) => set({ couponCode: code }),
      setPaymentMethod: (m) => set({ paymentMethod: m }),
      setMobileProvider: (p) => set({ mobileProvider: p }),
      setSplitPayments: (parts) => set({ splitPayments: parts }),
      setAmountTendered: (n) => set({ amountTendered: n }),
      clearCart: () =>
        set((s) => ({
          lines: [],
          customerId: null,
          locationId: s.locationId,
          discount: 0,
          discountType: 'amount',
          couponCode: null,
          paymentMethod: 'cash',
          mobileProvider: null,
          splitPayments: [],
          amountTendered: 0
        }))
    }),
    { name: 'Nova:v1:cart', storage: createJSONStorage(() => localStorage) }
  )
);
