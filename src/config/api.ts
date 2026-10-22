// Endereço do back-end. No build de produção vem de VITE_API_URL; sem ela, usa o back local.
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8081").replace(/\/+$/, "");
