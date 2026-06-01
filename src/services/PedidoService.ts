import { Pedido, PedidoStatus } from '../types';

const API_URL = "http://localhost:8081/pedidos";

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

function getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
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
    descricao: string;
    prazo: string;
    objeto3D?: File | null;
    imagensReferencia?: File[];
}

function hasUploads(data: CriarPedidoData): boolean {
    return !!data.objeto3D || !!data.imagensReferencia?.length;
}

function toFormData(data: CriarPedidoData): FormData {
    const formData = new FormData();

    formData.append("cliente", data.cliente);
    formData.append("projeto", data.projeto);
    formData.append("descricao", data.descricao);
    formData.append("prazo", data.prazo);

    if (data.objeto3D) {
        formData.append("objeto3D", data.objeto3D);
    }

    data.imagensReferencia?.forEach((imagem) => {
        formData.append("imagensReferencia", imagem);
    });

    return formData;
}

export async function criarPedido(data: CriarPedidoData): Promise<Pedido> {
    const uploads = hasUploads(data);
    const response = await fetch(API_URL, {
        method: "POST",
        headers: uploads ? getAuthHeader() : getHeaders(),
        body: uploads ? toFormData(data) : JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao criar pedido");
    return response.json();
}

export async function editarPedido(id: string, data: CriarPedidoData): Promise<Pedido> {
    const uploads = hasUploads(data);
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: uploads ? getAuthHeader() : getHeaders(),
        body: uploads ? toFormData(data) : JSON.stringify(data),
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
