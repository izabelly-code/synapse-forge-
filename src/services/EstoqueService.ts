import { UnidadeMedida } from "../models/Material";
import { PedidoStatus } from "../types";

const API_URL = "http://localhost:8081/estoque";

export type TipoInsumo = "MATERIAL" | "COR";

export type TipoMovimento = "ENTRADA" | "BAIXA" | "ESTORNO" | "AJUSTE";

export interface SaldoInsumo {
    tipoInsumo: TipoInsumo;
    insumoId: string;
    nome: string;
    unidade: UnidadeMedida;
    saldo: number;
    estoqueMinimo: number;
    emAlerta: boolean;
}

export interface AlertaEstoque {
    tipoInsumo: TipoInsumo;
    insumoId: string;
    nome: string;
    unidade: UnidadeMedida;
    saldo: number;
    estoqueMinimo: number;
}

export interface MovimentoEstoque {
    id: string;
    tipoInsumo: TipoInsumo;
    insumoId: string;
    tipo: TipoMovimento;
    /** Sempre na unidade base do insumo (G, ML ou UN). AJUSTE guarda o sinal; os demais são positivos. */
    quantidade: number;
    unidade: UnidadeMedida;
    saldoApos: number;
    custoUnitario?: number | null;
    custoTotal?: number | null;
    pedidoId?: string | null;
    etapaOrigem?: PedidoStatus | null;
    motivo?: string | null;
    usuarioId?: string | null;
    criadoEm: string;
}

/** Corpo de POST /estoque/entrada e /estoque/ajuste. No ajuste a quantidade pode ser negativa. */
export interface MovimentoInput {
    tipoInsumo: TipoInsumo;
    insumoId: string;
    quantidade: number;
    unidade: UnidadeMedida;
    motivo?: string;
}

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

function queryInsumo(tipoInsumo: TipoInsumo, insumoId: string): string {
    const params = new URLSearchParams({ tipoInsumo, insumoId });
    return params.toString();
}

/**
 * Erro de movimentação. O backend responde as recusas em texto puro: 400 para
 * unidade incompatível ou quantidade inválida e 422 para saldo insuficiente
 * (com o insumo e as quantidades). Nesses casos `detalhado` é true e a
 * mensagem vai inteira ao usuário; nos demais vale o texto genérico do service.
 */
export class EstoqueError extends Error {
    readonly status: number;
    readonly detalhado: boolean;

    constructor(message: string, status: number, detalhado: boolean) {
        super(message);
        this.name = "EstoqueError";
        this.status = status;
        this.detalhado = detalhado;
    }
}

async function lancarErro(response: Response, fallback: string): Promise<never> {
    const texto = await response.text().catch(() => "");
    const detalhado = (response.status === 400 || response.status === 422) && texto.trim().length > 0;
    throw new EstoqueError(detalhado ? texto.trim() : fallback, response.status, detalhado);
}

export async function getSaldo(tipoInsumo: TipoInsumo, insumoId: string): Promise<SaldoInsumo> {
    const response = await fetch(`${API_URL}/saldo?${queryInsumo(tipoInsumo, insumoId)}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar saldo");
    return response.json();
}

export async function getAlertas(): Promise<AlertaEstoque[]> {
    const response = await fetch(`${API_URL}/alertas`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar alertas de estoque");
    return response.json();
}

export async function getMovimentos(tipoInsumo: TipoInsumo, insumoId: string): Promise<MovimentoEstoque[]> {
    const response = await fetch(`${API_URL}/movimentos?${queryInsumo(tipoInsumo, insumoId)}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar movimentações");
    return response.json();
}

export async function registrarEntrada(data: MovimentoInput): Promise<MovimentoEstoque> {
    const response = await fetch(`${API_URL}/entrada`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) return lancarErro(response, "Falha ao registrar entrada de estoque");
    return response.json();
}

export async function registrarAjuste(data: MovimentoInput): Promise<MovimentoEstoque> {
    const response = await fetch(`${API_URL}/ajuste`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) return lancarErro(response, "Falha ao registrar ajuste de estoque");
    return response.json();
}
