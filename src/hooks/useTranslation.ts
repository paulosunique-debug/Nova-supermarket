import { useSettingsStore } from '../stores/useSettingsStore';
import { translations, type TranslationKey, type Language } from '../i18n/translations';

export function useTranslation() {
  const language = useSettingsStore((s) => s.settings.language) as Language;
  const dict = translations[language] ?? translations.English;

  function t(key: TranslationKey): string {
    return dict[key] ?? translations.English[key] ?? key;
  }

  return { t, language };
}
