import { Cor } from '../types';

const STORAGE_KEY = 'cores:catalogo';

const SEED: Cor[] = [
    { id: 'cor_1', nome: 'Vermelho Queimado', fornecedor: 'Coral Tintas', codigo: 'CT-204', hex: '#963A28', acabamento: 'FOSCO', estoqueMl: 450, estoqueMinimoMl: 500, custoMl: 0.28 },
    { id: 'cor_2', nome: 'Azul Cobalto', fornecedor: 'Sherwin-Williams', codigo: 'SW-118', hex: '#1E40AF', acabamento: 'BRILHANTE', estoqueMl: 1250, estoqueMinimoMl: 500, custoMl: 0.36 },
    { id: 'cor_3', nome: 'Verde Oliva', fornecedor: 'Coral Tintas', codigo: 'CT-331', hex: '#5E6B33', acabamento: 'CETIM', estoqueMl: 300, estoqueMinimoMl: 500, custoMl: 0.30 },
    { id: 'cor_4', nome: 'Bege Areia', fornecedor: 'Suvinil', codigo: 'SV-072', hex: '#CDBA98', acabamento: 'FOSCO', estoqueMl: 980, estoqueMinimoMl: 500, custoMl: 0.25 },
    { id: 'cor_5', nome: 'Preto Fosco', fornecedor: 'Weg Tintas', codigo: 'WG-001', hex: '#1E1E1E', acabamento: 'FOSCO', estoqueMl: 620, estoqueMinimoMl: 500, custoMl: 0.31 },
    { id: 'cor_6', nome: 'Branco Gelo', fornecedor: 'Suvinil', codigo: 'SV-010', hex: '#F1F0EA', acabamento: 'CETIM', estoqueMl: 1800, estoqueMinimoMl: 500, custoMl: 0.22 },
    { id: 'cor_7', nome: 'Terracota', fornecedor: 'Coral Tintas', codigo: 'CT-289', hex: '#C26A45', acabamento: 'FOSCO', estoqueMl: 210, estoqueMinimoMl: 500, custoMl: 0.29 },
    { id: 'cor_8', nome: 'Amarelo Mostarda', fornecedor: 'Sherwin-Williams', codigo: 'SW-447', hex: '#D9A227', acabamento: 'METALICO', estoqueMl: 560, estoqueMinimoMl: 500, custoMl: 0.27 },
];

function carregar(): Cor[] {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (!dados) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
        return SEED;
    }
    try {
        return JSON.parse(dados) as Cor[];
    } catch {
        return SEED;
    }
}

function salvar(cores: Cor[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cores));
}

function delay<T>(valor: T, ms = 200): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(valor), ms));
}

export interface CorInput {
    nome: string;
    fornecedor: string;
    codigo?: string;
    hex: string;
    acabamento: Cor['acabamento'];
    estoqueMl: number;
    estoqueMinimoMl: number;
    custoMl: number;
}

export async function getCores(): Promise<Cor[]> {
    return delay(carregar());
}

export async function criarCor(data: CorInput): Promise<Cor> {
    const cores = carregar();
    const nova: Cor = { id: `cor_${Date.now()}`, criadoEm: new Date().toISOString(), ...data };
    const proximas = [nova, ...cores];
    salvar(proximas);
    return delay(nova);
}

export async function editarCor(id: string, data: CorInput): Promise<Cor> {
    const cores = carregar();
    const atualizada = cores.map((c) => (c.id === id ? { ...c, ...data } : c));
    salvar(atualizada);
    const cor = atualizada.find((c) => c.id === id)!;
    return delay(cor);
}

export async function deletarCor(id: string): Promise<void> {
    const cores = carregar().filter((c) => c.id !== id);
    salvar(cores);
    await delay(null);
}
