import { useEffect, useRef } from 'react';
import { useProductStore } from '../stores/useProductStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { storage } from '../services/storage';
import { getExpiryStatus } from '../utils/date';

const NOTIFIED_DATE_KEY = 'expiryNotifiedDate';

export function useExpiryAlerts() {
  const products = useProductStore((s) => s.products);
  const push = useNotificationStore((s) => s.push);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (products.length === 0) return;

    const today = new Date().toDateString();
    const lastNotified = storage.get<string>(NOTIFIED_DATE_KEY, '');
    if (lastNotified === today) {
      ran.current = true;
      return;
    }

    const expired = products.filter((p) => getExpiryStatus(p.expiryDate) === 'expired');
    const expiringSoon = products.filter((p) => getExpiryStatus(p.expiryDate) === 'expiring');

    if (expired.length > 0) {
      push('error', 'Products expired', `${expired.length} product${expired.length > 1 ? 's have' : ' has'} passed its expiry date.`);
    }
    if (expiringSoon.length > 0) {
      push('warning', 'Expiring soon', `${expiringSoon.length} product${expiringSoon.length > 1 ? 's are' : ' is'} expiring within the next 3 months.`);
    }

    storage.set(NOTIFIED_DATE_KEY, today);
    ran.current = true;
  }, [products, push]);
}
