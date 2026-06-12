import { Material, MaterialInput } from "../models/Material";

const API_URL = "http://localhost:8081/materiais";

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getMateriais(): Promise<Material[]> {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar materiais");
    return response.json();
}

export async function getMaterialById(id: string): Promise<Material> {
    const response = await fetch(`${API_URL}/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar material");
    return response.json();
}

export async function criarMaterial(data: MaterialInput): Promise<Material> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao criar material");
    return response.json();
}

export async function editarMaterial(id: string, data: MaterialInput): Promise<Material> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao editar material");
    return response.json();
}

export async function inativarMaterial(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao inativar material");
}
