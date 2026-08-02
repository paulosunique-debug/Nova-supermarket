import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { StockTransfer } from '../types';
import { useProductStore } from './useProductStore';
import { useNotificationStore } from './useNotificationStore';

interface TransferState {
  transfers: StockTransfer[];
  create: (productId: string, fromLocationId: string, toLocationId: string, quantity: number, reason: string, transferredBy: string | null) => boolean;
}

export const useTransferStore = create<TransferState>()(
  persist(
    (set) => ({
      transfers: [],
      create: (productId, fromLocationId, toLocationId, quantity, reason, transferredBy) => {
        if (fromLocationId === toLocationId) {
          useNotificationStore.getState().push('error', 'Transfer failed', 'Source and destination locations must be different.');
          return false;
        }
        const ok = useProductStore.getState().transfer(productId, fromLocationId, toLocationId, quantity, reason);
        if (!ok) return false;
        const record: StockTransfer = {
          id: generateId('trf'),
          productId,
          fromLocationId,
          toLocationId,
          quantity,
          reason,
          transferredBy,
          createdAt: new Date().toISOString()
        };
        set((s) => ({ transfers: [record, ...s.transfers] }));
        useNotificationStore.getState().push('success', 'Stock transferred', `${quantity} unit(s) moved successfully.`);
        return true;
      }
    }),
    { name: 'Nova:v1:transfers', storage: createJSONStorage(() => localStorage) }
  )
);
