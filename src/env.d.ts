/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_BASE_URL: string;
  readonly VITE_APP_FRONT_URL: string;
  readonly VITE_APP_API_URL: string;
  readonly VITE_APP_SHOW_LOG: string;
  readonly VITE_APP_META_ROBOTS: string;
  readonly VITE_APPLICATION_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
