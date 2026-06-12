import { Mistura } from '../types';

const API_URL = "http://localhost:8081/misturas";

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export interface MisturaInput {
    nome: string;
    itens: { corId: string; proporcao: number }[];
    volumeMl: number;
}

export async function getMisturas(): Promise<Mistura[]> {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar misturas");
    return response.json();
}

export async function criarMistura(data: MisturaInput): Promise<Mistura> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

export async function deletarMistura(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao excluir a mistura");
}
