
import { User } from "../types";

// =========================================================
// CONFIGURAÇÃO
// =========================================================

const API_URL = "http://localhost:8081/admin";

// =========================================================
// HEADERS
// =========================================================

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

// =========================================================
// TIPOS ADMINISTRATIVOS
// =========================================================

export interface AdminUser extends User {
    cpf?: string;
    telefone?: string;
    equipeId?: string;
    funcaoVisual?: string;
    ativo: boolean;
    criadoEm?: string;
    atualizadoEm?: string;
}

export interface AdminPedido {
    id: string;

    clienteId?: string;
    cliente: string;

    projeto: string;
    descricao?: string;

    orcamentoId?: string;
    materialId?: string;

    volumeCm3?: number;
    tempoImpressaoHoras?: number;
    tempoMaoDeObraHoras?: number;

    custoMaquinaHora?: number;
    custoMaoDeObraHora?: number;
    margemLucro?: number;

    custoMaterial?: number;
    custoMaquina?: number;
    custoMaoDeObra?: number;
    custoTotal?: number;
    precoFinal?: number;

    status?: string;

    prazo?: string;

    criadoEm?: string;
    atualizadoEm?: string;

    objeto3DFileId?: string;
    quantidadeImagensReferencia: number;
}


export interface AdminPedidoUpdateData {
    clienteId?: string;
    cliente?: string;
    projeto?: string;
    descricao?: string;
    materialId?: string;
    volumeCm3?: number;
    tempoImpressaoHoras?: number;
    tempoMaoDeObraHoras?: number;
    custoMaquinaHora?: number;
    custoMaoDeObraHora?: number;
    margemLucro?: number;
    custoMaterial?: number;
    custoMaquina?: number;
    custoMaoDeObra?: number;
    custoTotal?: number;
    precoFinal?: number;
    status?: string;
    prazo?: string;
}

// =========================================================
// USUÁRIOS
// =========================================================

export async function getAdminUsers(): Promise<AdminUser[]> {
    const response = await fetch(
        `${API_URL}/usuarios`,
        {
            method: "GET",
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Falha ao buscar usuários da administração."
        );
    }

    return await response.json();
}

export interface AdminUserUpdateData {
    nome?: string;
    email?: string;
    cpf?: string;
    telefone?: string;
    role?: "ADMIN" | "GERENTE" | "TECNICO" | "CLIENTE";
    equipeId?: string;
    funcaoVisual?: string;
    ativo?: boolean;
    senha?: string;
}

export async function atualizarAdminUser(
    id: string,
    data: AdminUserUpdateData
): Promise<AdminUser> {
    const response = await fetch(
        `${API_URL}/usuarios/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Falha ao atualizar usuário."
        );
    }

    return await response.json();
}

export async function deletarAdminUser(
    id: string
): Promise<void> {
    const response = await fetch(
        `${API_URL}/usuarios/${encodeURIComponent(id)}`,
        {
            method: "DELETE",
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Falha ao excluir usuário."
        );
    }
}


// =========================================================
// PEDIDOS
// =========================================================

export async function getAdminPedidos(): Promise<AdminPedido[]> {
    const response = await fetch(
        `${API_URL}/pedidos`,
        {
            method: "GET",
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Falha ao buscar pedidos da administração."
        );
    }

    return await response.json();
}

export async function atualizarAdminPedido(
    id: string,
    data: AdminPedidoUpdateData
): Promise<AdminPedido> {
    const response = await fetch(
        `${API_URL}/pedidos/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Falha ao atualizar pedido."
        );
    }

    return await response.json();
}


export async function deletarAdminPedido(
    id: string
): Promise<void> {
    const response = await fetch(
        `${API_URL}/pedidos/${encodeURIComponent(id)}`,
        {
            method: "DELETE",
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Falha ao excluir pedido."
        );
    }
}



