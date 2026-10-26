import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/users/me/preferencias`;

export type TemaPreferido = "claro" | "escuro";
export type IdiomaPreferido = "pt-BR" | "en-US";
export type PeriodoPainel = "30d" | "90d" | "6m" | "12m" | "ano" | "tudo";
export type WidgetId = "indicadores" | "pedidosPorMes" | "pedidosPorEtapa" | "materiaisMaisUsados" | "estoqueBaixo";

export interface WidgetPreferencia {
    id: WidgetId;
    visivel: boolean;
}

/** Layout do painel gerencial: a ordem da lista é a ordem na tela. */
export interface PreferenciasDashboard {
    periodo: PeriodoPainel;
    widgets: WidgetPreferencia[];
}

/** GET/PUT /users/me/preferencias (SYN-166). Campo nunca salvo vem null. */
export interface Preferencias {
    tema: TemaPreferido | null;
    idioma: IdiomaPreferido | null;
    dashboard: PreferenciasDashboard | null;
}

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getPreferencias(): Promise<Preferencias> {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) {
        throw new Error("Falha ao buscar preferências");
    }
    return response.json();
}

/** Campos ausentes mantêm o valor salvo; `dashboard`, quando vai, substitui o layout inteiro. */
export async function salvarPreferencias(parcial: Partial<Preferencias>): Promise<Preferencias> {
    const response = await fetch(API_URL, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(parcial),
    });
    if (!response.ok) {
        throw new Error("Falha ao salvar preferências");
    }
    return response.json();
}
