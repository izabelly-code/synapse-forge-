export interface Material {
    id: string;
    nome: string;
    tipo: string;
    densidadeGcm3: number;
    precoPorGrama: number;
    ativo: boolean;
}

export interface MaterialInput {
    nome: string;
    tipo: string;
    densidadeGcm3: number;
    precoPorGrama: number;
    ativo: boolean;
}
