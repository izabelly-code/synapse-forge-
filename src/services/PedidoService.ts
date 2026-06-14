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

export async function getPedido(id: string): Promise<Pedido> {
    const response = await fetch(`${API_URL}/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar pedido");
    console.log("Resposta do servidor:", await response.clone().text());
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

export async function regredirStatus(id: string): Promise<Pedido> {
    const response = await fetch(`${API_URL}/${id}/status/regredir`, {
        method: "PATCH",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao regredir status");
    return response.json();
}

export interface PedidoFormData {
    cliente: string;
    projeto: string;
    descricao: string;
    prazo: string;
    status?: PedidoStatus;
    objeto3D?: File | null;
    imagensReferencia?: File[];
    removerObjeto3D?: boolean;
    imagensRemover?: string[];
}

function hasUploads(data: PedidoFormData): boolean {
    return !!data.objeto3D || !!data.imagensReferencia?.length;
}

function toFormData(data: PedidoFormData): FormData {
    const formData = new FormData();

    formData.append("cliente", data.cliente);
    formData.append("projeto", data.projeto);
    formData.append("descricao", data.descricao);
    formData.append("prazo", data.prazo);
    if (data.status) formData.append("status", data.status);
    formData.append("removerObjeto3D", String(!!data.removerObjeto3D));

    if (data.objeto3D) {
        formData.append("objeto3D", data.objeto3D);
    }

    data.imagensReferencia?.forEach((imagem) => {
        formData.append("imagensReferencia", imagem);
    });
    data.imagensRemover?.forEach((id) => {
        formData.append("imagensRemover", id);
    });

    return formData;
}

export async function criarPedido(data: PedidoFormData): Promise<Pedido> {
    const uploads = hasUploads(data);
    const response = await fetch(API_URL, {
        method: "POST",
        headers: uploads ? getAuthHeader() : getHeaders(),
        body: uploads ? toFormData(data) : JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao criar pedido");
    return response.json();
}

export async function editarPedido(id: string, data: PedidoFormData): Promise<Pedido> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: toFormData(data),
    });
    if (!response.ok) throw new Error("Falha ao editar pedido");
    return response.json();
}

function parseContentDispositionFileName(disposition: string | null): string | null {
    if (!disposition) return null;

    const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const regularMatch = disposition.match(/filename="?([^";]+)"?/i);
    const rawFileName = encodedMatch?.[1] || regularMatch?.[1];

    if (!rawFileName) return null;

    try {
        return decodeURIComponent(rawFileName.trim());
    } catch {
        return rawFileName.trim();
    }
}

function extensionFromMimeType(mimeType: string | null): string {
    if (!mimeType) return "";
    const map: Record<string, string> = {
        "model/stl": ".stl",
        "application/sla": ".stl",
        "model/obj": ".obj",
        "text/plain": ".obj",
        "application/octet-stream": ".bin",
        "application/vnd.ms-pki.stl": ".stl",
        "application/x-tgif": ".obj",
    };
    return map[mimeType.toLowerCase()] || "";
}

export async function deletarPedido(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao deletar pedido");
}

export async function baixarObjeto3D(pedidoId: string, downloadFileName?: string): Promise<void> {
    const response = await fetch(`${API_URL}/${pedidoId}/obj3d`, {
        method: "GET",
        headers: getAuthHeader(),
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error("Sua sessao expirou. Entre novamente para baixar o arquivo.");
        }
        if (response.status === 404) {
            throw new Error("O arquivo 3D nao foi encontrado.");
        }
        throw new Error(`Falha ao baixar objeto 3D (${response.status}).`);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
        throw new Error("O arquivo 3D esta vazio.");
    }

    const disposition = response.headers.get("Content-Disposition");
    let finalFileName = parseContentDispositionFileName(disposition) || downloadFileName || "objeto3d";
    const fileNameParts = finalFileName.split(/[\\/]/);
    finalFileName = fileNameParts[fileNameParts.length - 1] || "objeto3d";

    if (!finalFileName.includes(".")) {
        const extension = extensionFromMimeType(blob.type) || ".obj";
        finalFileName += extension;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = finalFileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

