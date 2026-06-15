import { CalcularOrcamentoInput, Orcamento } from "../models/Orcamento";

const API_URL = "http://localhost:8081/orcamentos";

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function calcularOrcamento(data: CalcularOrcamentoInput): Promise<Orcamento> {
    const response = await fetch(`${API_URL}/calcular`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao calcular orçamento");
    return response.json();
}

export async function salvarOrcamento(data: CalcularOrcamentoInput): Promise<Orcamento> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao salvar orçamento");
    return response.json();
}

export async function getOrcamentos(): Promise<Orcamento[]> {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar orçamentos");
    return response.json();
}

export async function getOrcamentoById(id: string): Promise<Orcamento> {
    const response = await fetch(`${API_URL}/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar orçamento");
    return response.json();
}
