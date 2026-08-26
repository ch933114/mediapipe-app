import { createI18n } from "vue-i18n";

import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";

export const DEFAULT_LOCALE = "zh-TW" as const;
export const FALLBACK_LOCALE = "zh-TW" as const;
export const SUPPORTED_LOCALES = ["zh-TW", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    "zh-TW": zhTW,
    en,
  },
});
