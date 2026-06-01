import { Cor } from '../types';

const API_URL = "http://localhost:8081/cores";

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
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
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar cores");
    return response.json();
}

export async function criarCor(data: CorInput): Promise<Cor> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao criar cor");
    return response.json();
}

export async function editarCor(id: string, data: CorInput): Promise<Cor> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao editar cor");
    return response.json();
}

export async function deletarCor(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao deletar cor");
}
