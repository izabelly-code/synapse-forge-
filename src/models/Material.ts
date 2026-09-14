/** Unidades aceitas pelo backend (RF11). G/KG e ML/L convertem entre si; UN é contagem. */
export type UnidadeMedida = "G" | "KG" | "ML" | "L" | "UN";

export const UNIDADES: UnidadeMedida[] = ["G", "KG", "ML", "L", "UN"];

export interface Material {
    id: string;
    nome: string;
    tipo: string;
    densidadeGcm3: number;
    precoPorGrama: number;
    ativo: boolean;
    unidade: string;
    saldo: number;
    estoqueMinimo: number;
}

/**
 * Sem `saldo` de propósito: o backend removeu o campo do request para o
 * cadastro não reescrever o saldo por fora das movimentações de estoque.
 */
export interface MaterialInput {
    nome: string;
    tipo: string;
    densidadeGcm3: number;
    precoPorGrama: number;
    ativo: boolean;
    unidade: UnidadeMedida;
    estoqueMinimo: number;
}
