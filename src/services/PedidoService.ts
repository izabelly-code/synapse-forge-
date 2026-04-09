import { Pedido, PedidoStatus } from '../types';

const API_URL = "http://localhost:8081/pedidos";

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getPedidos(status?: PedidoStatus): Promise<Pedido[]> {
    const url = status ? `${API_URL}?status=${status}` : API_URL;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar pedidos");
    return response.json();
}

export async function avancarStatus(id: string): Promise<Pedido> {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao avançar status");
    return response.json();
}

interface CriarPedidoData {
    cliente: string;
    projeto: string;
    descricao?: string;
    prazo: string;
}

export async function criarPedido(data: CriarPedidoData): Promise<Pedido> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao criar pedido");
    return response.json();
}
