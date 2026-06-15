export interface CalcularOrcamentoInput {
    materialId: string;
    volumeCm3: number;
    tempoImpressaoHoras: number;
    tempoMaoDeObraHoras: number;
    custoMaquinaHora: number;
    custoMaoDeObraHora: number;
    margemLucro: number;
}

export interface Orcamento {
    id: string | null;
    materialId: string;
    nomeMaterial: string;
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
}
