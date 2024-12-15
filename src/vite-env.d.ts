/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TARGET_BASE_URL: string
  readonly VITE_TARGET_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
