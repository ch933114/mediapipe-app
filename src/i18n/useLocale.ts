import { useI18n } from "vue-i18n";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n";

export function useLocale() {
  const { locale, t } = useI18n();

  function setLocale(next: string) {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(next)) return;
    locale.value = next as SupportedLocale;
    document.documentElement.lang = next;
  }

  return {
    locale,
    t,
    setLocale,
    defaultLocale: DEFAULT_LOCALE,
    supportedLocales: SUPPORTED_LOCALES,
  };
}
