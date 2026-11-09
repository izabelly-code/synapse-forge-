import { FormaEnvio, FormaEnvioInput } from "../types";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/formas-envio`;

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

/** Formas ativas: as padrão do sistema mais as cadastradas pela equipe do usuário. */
export async function getFormasEnvio(): Promise<FormaEnvio[]> {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar formas de envio");
    return response.json();
}

export async function criarFormaEnvio(data: FormaEnvioInput): Promise<FormaEnvio> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao criar forma de envio");
    return response.json();
}
