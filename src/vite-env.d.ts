/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_UPI_ID?: string;
  readonly VITE_UPI_NAME?: string;
}

interface Window {
  bizoraDesktop?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
