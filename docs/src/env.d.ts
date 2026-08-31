interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly MODE: 'development' | 'production';
  readonly PROD: boolean;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}