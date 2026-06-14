import { EtapaOrdemPintura, OrdemPintura, PrioridadeOrdemPintura } from "../types";

const API_URL = "http://localhost:8081/ordens-pintura";

function headers(): Record<string, string> {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
}

export interface NovaOrdemPintura {
    pedidoId: string;
    corId: string;
    tecnico: string;
    prioridade: PrioridadeOrdemPintura;
    prazo: string;
}

export async function getOrdensPintura(): Promise<OrdemPintura[]> {
    const response = await fetch(API_URL, { headers: headers() });
    if (!response.ok) throw new Error("Falha ao carregar ordens de pintura");
    return response.json();
}

export async function criarOrdemPintura(data: NovaOrdemPintura): Promise<OrdemPintura> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao criar ordem de pintura");
    return response.json();
}

export async function editarOrdemPintura(id: string, data: NovaOrdemPintura): Promise<OrdemPintura> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao editar ordem de pintura");
    return response.json();
}

export async function excluirOrdemPintura(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: headers(),
    });
    if (!response.ok) throw new Error("Falha ao excluir ordem de pintura");
}

export async function atualizarEtapaOrdemPintura(
    id: string,
    etapa: EtapaOrdemPintura,
): Promise<OrdemPintura> {
    const response = await fetch(`${API_URL}/${id}/etapa`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ etapa }),
    });
    if (!response.ok) throw new Error("Falha ao atualizar etapa");
    return response.json();
}
