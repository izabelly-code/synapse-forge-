export interface CalcularOrcamentoInput {
    cliente: string;
    projeto: string;
    descricao?: string;
    prazo: string;
    materialId: string;
    volumeCm3: number;
    tempoImpressaoHoras: number;
    tempoMaoDeObraHoras: number;
    custoMaquinaHora: number;
    custoMaoDeObraHora: number;
    margemLucro: number;
    objeto3D?: File | null;
    imagensReferencia?: File[];
}

export type OrcamentoStatus = "PENDENTE" | "APROVADO" | "REJEITADO";

export interface Orcamento {
    id: string | null;
    materialId: string;
    nomeMaterial: string;
    cliente: string;
    projeto: string;
    descricao?: string;
    prazo: string;
    volumeCm3: number;
    tempoImpressaoHoras: number;
    tempoMaoDeObraHoras: number;
    custoMaquinaHora: number;
    custoMaoDeObraHora: number;
    margemLucro: number;
    custoMaterial: number;
    custoMaquina: number;
    custoMaoDeObra: number;
    custoTotal: number;
    precoFinal: number;
    criadoEm: string | null;
    status?: OrcamentoStatus;
    pedidoId?: string;
}
