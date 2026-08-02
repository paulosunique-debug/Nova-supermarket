import { useRef, useState } from 'react';
import { Save, Image as ImageIcon, Download, Upload, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { resetAllData } from '../hooks/useAppInit';
import { storage } from '../services/storage';
import { exportJSON } from '../utils/csv';

const CURRENCIES = [
  { value: 'ETB', label: 'ETB — Ethiopian Birr' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'KES', label: 'KES (KSh)' },
  { value: 'INR', label: 'INR (₹)' }
];

export default function Settings() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const notify = useNotificationStore((s) => s.push);
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ logoUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  function handleBackup() {
    const keys = ['products', 'categories', 'customers', 'suppliers', 'sales', 'stockLogs', 'purchaseOrders', 'expenses', 'settings'];
    const backup: Record<string, unknown> = {};
    keys.forEach((k) => (backup[k] = storage.get(k, null)));
    exportJSON('Nova-backup.json', backup);
    notify('success', 'Backup created', 'Your data has been exported as a JSON file.');
  }

  function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        Object.entries(data).forEach(([key, value]) => storage.set(key, value));
        notify('success', 'Backup restored', 'Reloading the app with your restored data…');
        setTimeout(() => window.location.reload(), 800);
      } catch {
        notify('error', 'Restore failed', 'That file could not be read as a valid backup.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('settings_title')}</h1>
        <p className="text-sm text-slate2-400">{t('settings_subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings_storeInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate2-200 bg-slate2-50 text-slate2-400 dark:border-slate2-600 dark:bg-slate2-900">
              {settings.logoUrl ? <img src={settings.logoUrl} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </label>
            <div className="w-full flex-1">
              <Input label={t('settings_storeName')} value={settings.storeName} onChange={(e) => update({ storeName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t('settings_currency')}
              value={settings.currency}
              onChange={(e) => update({ currency: e.target.value })}
              options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
            />
            <Select
              label={t('settings_language')}
              value={settings.language}
              onChange={(e) => update({ language: e.target.value })}
              options={[
                { value: 'English', label: 'English' },
                { value: 'Amharic', label: 'አማርኛ (Amharic)' }
              ]}
            />
          </div>
          <Input label={t('settings_defaultTaxRate')} type="number" step="0.5" value={settings.defaultTaxRate} onChange={(e) => update({ defaultTaxRate: Number(e.target.value) })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings_receiptSettings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea label={t('settings_receiptFooter')} rows={2} value={settings.receiptFooter} onChange={(e) => update({ receiptFooter: e.target.value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings_appearance')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Switch checked={theme === 'dark'} onChange={toggle} label={t('settings_darkMode')} />
          <Switch checked={settings.notificationsEnabled} onChange={() => update({ notificationsEnabled: !settings.notificationsEnabled })} label={t('settings_enableNotifications')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings_dataManagement')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleBackup}>
            <Download className="h-4 w-4" /> {t('settings_backup')}
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> {t('settings_restore')}
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleRestore} />
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <RotateCcw className="h-4 w-4" /> {t('settings_resetAll')}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={resetAllData}
        title={t('settings_resetConfirmTitle')}
        description={t('settings_resetConfirmDesc')}
        confirmLabel={t('settings_resetConfirmLabel')}
      />
    </div>
  );
}
