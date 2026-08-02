import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotificationStore } from '../../stores/useNotificationStore';
import type { NotificationType } from '../../types';

const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-market-500" />,
  error: <XCircle className="h-5 w-5 text-tomato-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-citrus-500" />,
  info: <Info className="h-5 w-5 text-slate2-400" />
};

export function ToastContainer() {
  const toasts = useNotificationStore((s) => s.toasts);
  const dismiss = useNotificationStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-80">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate2-100 bg-white p-3.5 shadow-pop dark:border-slate2-700 dark:bg-slate2-800"
          >
            {iconMap[t.type]}
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink dark:text-slate2-50">{t.title}</p>
              <p className="mt-0.5 text-xs text-slate2-400">{t.message}</p>
            </div>
            <button onClick={() => dismiss(t.id)} className="text-slate2-300 hover:text-slate2-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
