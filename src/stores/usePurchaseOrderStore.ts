import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { PurchaseOrder, PurchaseOrderItem } from '../types';
import { useNotificationStore } from './useNotificationStore';

interface PurchaseOrderState {
  orders: PurchaseOrder[];
  setAll: (orders: PurchaseOrder[]) => void;
  create: (supplierId: string, items: PurchaseOrderItem[], createdBy: string | null, autoApprove: boolean) => PurchaseOrder;
  markDelivered: (id: string) => void;
  cancel: (id: string) => void;
  approve: (id: string, approverId: string) => void;
  reject: (id: string, approverId: string) => void;
}

export const usePurchaseOrderStore = create<PurchaseOrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      setAll: (orders) => set({ orders }),
      create: (supplierId, items, createdBy, autoApprove) => {
        const poNumber = `PO-${20000 + get().orders.length}`;
        const order: PurchaseOrder = {
          id: generateId('po'),
          poNumber,
          supplierId,
          items,
          status: 'pending',
          approvalStatus: autoApprove ? 'approved' : 'pending',
          createdBy,
          approvedBy: null,
          createdAt: new Date().toISOString(),
          deliveredAt: null
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        useNotificationStore
          .getState()
          .push('success', 'Purchase order created', autoApprove ? `${poNumber} was created and approved.` : `${poNumber} was created and awaits finance approval.`);
        return order;
      },
      markDelivered: (id) => {
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'delivered', deliveredAt: new Date().toISOString() } : o))
        }));
        const o = get().orders.find((x) => x.id === id);
        if (o) useNotificationStore.getState().push('success', 'Order delivered', `${o.poNumber} marked as delivered.`);
      },
      cancel: (id) => {
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)) }));
        const o = get().orders.find((x) => x.id === id);
        if (o) useNotificationStore.getState().push('warning', 'Order cancelled', `${o.poNumber} was cancelled.`);
      },
      approve: (id, approverId) => {
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, approvalStatus: 'approved', approvedBy: approverId } : o)) }));
        const o = get().orders.find((x) => x.id === id);
        if (o) useNotificationStore.getState().push('success', 'PO approved', `${o.poNumber} was approved by finance.`);
      },
      reject: (id, approverId) => {
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, approvalStatus: 'rejected', approvedBy: approverId } : o)) }));
        const o = get().orders.find((x) => x.id === id);
        if (o) useNotificationStore.getState().push('warning', 'PO rejected', `${o.poNumber} was rejected by finance.`);
      }
    }),
    { name: 'Nova:v1:purchaseOrders', storage: createJSONStorage(() => localStorage) }
  )
);
