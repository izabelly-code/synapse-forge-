/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço do back-end (ex.: https://api.exemplo.com). Sem ela, http://localhost:8081. */
  readonly VITE_API_URL?: string;
}
