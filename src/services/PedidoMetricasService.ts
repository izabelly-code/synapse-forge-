import { PedidoStatus } from "../types";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/pedidos/metricas`;

/** GET /pedidos/metricas/por-status (PedidoStatusMetricaDTO no back). */
export interface PedidoStatusMetrica {
    status: PedidoStatus;
    quantidade: number;
    /** BigDecimal no back: chega como número, ou null quando nenhum pedido da etapa tem preço. */
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

export async function getPedidosPorStatus(): Promise<PedidoStatusMetrica[]> {
    const response = await fetch(`${API_URL}/por-status`, { headers: getHeaders() });
    if (!response.ok) {
        throw new Error("Falha ao buscar pedidos por etapa");
    }
    const lista: PedidoStatusMetrica[] = await response.json();
    return lista.map((m) => ({ ...m, valorTotal: paraNumero(m.valorTotal) }));
}

export async function getMateriaisMaisUsados(limite = 5): Promise<MaterialPedidoMetrica[]> {
    const response = await fetch(`${API_URL}/materiais-mais-usados?limite=${limite}`, { headers: getHeaders() });
    if (!response.ok) {
        throw new Error("Falha ao buscar materiais mais usados");
    }
    const lista: MaterialPedidoMetrica[] = await response.json();
    return lista.map((m) => ({ ...m, valorTotal: paraNumero(m.valorTotal) }));
}
