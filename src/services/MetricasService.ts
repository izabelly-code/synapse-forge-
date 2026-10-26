import { PedidoStatus } from "../types";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/pedidos/metricas`;

/** Intervalo de datas do filtro do painel, em "AAAA-MM-DD". Lado ausente = sem limite. */
export interface Intervalo {
    de?: string;
    ate?: string;
}

/** GET /pedidos/metricas/por-status (PedidoStatusMetricaDTO no back). */
export interface PedidoStatusMetrica {
    status: PedidoStatus;
    quantidade: number;
    /** BigDecimal no back: null quando nenhum pedido da etapa tem preço. */
    valorTotal: number | null;
    atrasados: number;
}

/** GET /pedidos/metricas/materiais-mais-usados (MaterialPedidoMetricaDTO no back). */
export interface MaterialPedidoMetrica {
    materialId: string;
    /** null quando o material foi excluído: o pedido continua contando, só fica sem nome. */
    nome: string | null;
    quantidadePedidos: number;
    valorTotal: number | null;
}

/** GET /pedidos/metricas/por-mes (PedidoMesMetricaDTO no back). Meses sem pedidos não vêm. */
export interface PedidoMesMetrica {
    /** "AAAA-MM" */
    mes: string;
    /** Pedidos criados no mês, sem os cancelados. */
    quantidade: number;
    cancelados: number;
    /** Soma do preço final dos pedidos não cancelados. */
    valorTotal: number | null;
}

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

/** BigDecimal pode vir como número ou texto, dependendo da serialização do Jackson. */
function paraNumero(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === "") return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function montarQuery(intervalo: Intervalo, extra: Record<string, string> = {}): string {
    const params = new URLSearchParams(extra);
    if (intervalo.de) params.set("de", intervalo.de);
    if (intervalo.ate) params.set("ate", intervalo.ate);
    const query = params.toString();
    return query ? `?${query}` : "";
}

async function buscar<T>(caminho: string, erro: string): Promise<T> {
    const response = await fetch(`${API_URL}${caminho}`, { headers: getHeaders() });
    if (!response.ok) {
        throw new Error(erro);
    }
    return response.json();
}

export async function getPedidosPorStatus(intervalo: Intervalo): Promise<PedidoStatusMetrica[]> {
    const lista = await buscar<PedidoStatusMetrica[]>(
        `/por-status${montarQuery(intervalo)}`,
        "Falha ao buscar pedidos por etapa",
    );
    return lista.map((m) => ({ ...m, valorTotal: paraNumero(m.valorTotal) }));
}

export async function getMateriaisMaisUsados(limite: number, intervalo: Intervalo): Promise<MaterialPedidoMetrica[]> {
    const lista = await buscar<MaterialPedidoMetrica[]>(
        `/materiais-mais-usados${montarQuery(intervalo, { limite: String(limite) })}`,
        "Falha ao buscar materiais mais usados",
    );
    return lista.map((m) => ({ ...m, valorTotal: paraNumero(m.valorTotal) }));
}

export async function getPedidosPorMes(intervalo: Intervalo): Promise<PedidoMesMetrica[]> {
    const lista = await buscar<PedidoMesMetrica[]>(
        `/por-mes${montarQuery(intervalo)}`,
        "Falha ao buscar pedidos por mês",
    );
    return lista.map((m) => ({ ...m, valorTotal: paraNumero(m.valorTotal) }));
}
