import { useEffect, useRef, useState } from 'react';
import { storage } from '../services/storage';
import { useUserStore } from '../stores/useUserStore';
import { useLocationStore } from '../stores/useLocationStore';

/**
 * App starts with no business data (products, sales, customers, etc.) — but it
 * does need one admin account to log in with, and at least one location for
 * inventory to live in. Those are bootstrapped here, not "demo data".
 */
export function useAppInit() {
  const [ready, setReady] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    useUserStore.getState().ensureBootstrapAdmin();
    useLocationStore.getState().ensureBootstrapLocations();
    setReady(true);
  }, []);

  return ready;
}

export function resetAllData() {
  storage.clearAll();
  window.location.reload();
}

// Kept for backward compatibility with any existing references.
export const resetDemoData = resetAllData;
