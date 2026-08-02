import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, children, width = 'max-w-md' }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`relative z-10 h-full w-full ${width} overflow-y-auto bg-white shadow-pop dark:bg-slate2-800`}
          >
            {title && (
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate2-100 bg-white px-6 py-4 dark:border-slate2-700 dark:bg-slate2-800">
                <h2 className="font-display text-lg font-semibold text-ink dark:text-slate2-50">{title}</h2>
                <button onClick={onClose} className="rounded-lg p-1.5 text-slate2-400 hover:bg-slate2-100 dark:hover:bg-slate2-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
