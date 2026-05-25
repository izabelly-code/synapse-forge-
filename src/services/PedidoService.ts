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

export async function editarPedido(id: string, data: CriarPedidoData): Promise<Pedido> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao editar pedido");
    return response.json();
}

export async function deletarPedido(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao deletar pedido");
}

export async function gerarOrdemServico(id: string): Promise<void> {

    const response = await fetch(`${API_URL}/${id}/ordem-servico`, {
        method: "GET",
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error("Falha ao gerar PDF");
    }

    // transforma resposta em arquivo PDF
    const blob = await response.blob();

    // cria URL temporária
    const url = window.URL.createObjectURL(blob);

    // cria elemento <a>
    const a = document.createElement("a");

    a.href = url;

    // nome do arquivo
    a.download = `ordem-servico-${id}.pdf`;

    // adiciona no body
    document.body.appendChild(a);

    // inicia download
    a.click();

    // remove elemento
    a.remove();

    // limpa memória
    window.URL.revokeObjectURL(url);
}