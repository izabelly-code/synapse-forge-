import { CalcularOrcamentoInput, Orcamento } from "../models/Orcamento";

const API_URL = "http://localhost:8081/orcamentos";

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

function getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
}

function toFormData(data: CalcularOrcamentoInput): FormData {
    const formData = new FormData();
    const campos = ["cliente", "projeto", "descricao", "prazo", "materialId", "volumeCm3", "tempoImpressaoHoras", "tempoMaoDeObraHoras", "custoMaquinaHora", "custoMaoDeObraHora", "margemLucro"] as const;
    campos.forEach((campo) => {
        const valor = data[campo];
        if (valor !== undefined && valor !== null) formData.append(campo, String(valor));
    });
    if (data.objeto3D) formData.append("objeto3D", data.objeto3D);
    data.imagensReferencia?.forEach((imagem) => formData.append("imagensReferencia", imagem));
    return formData;
}

export async function calcularOrcamento(data: CalcularOrcamentoInput): Promise<Orcamento> {
    const dadosCalculo = { ...data };
    delete dadosCalculo.objeto3D;
    delete dadosCalculo.imagensReferencia;
    const response = await fetch(`${API_URL}/calcular`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(dadosCalculo),
    });
    if (!response.ok) throw new Error("Falha ao calcular orçamento");
    return response.json();
}

export async function salvarOrcamento(data: CalcularOrcamentoInput): Promise<Orcamento> {
    const possuiUploads = !!data.objeto3D || !!data.imagensReferencia?.length;
    const response = await fetch(API_URL, {
        method: "POST",
        headers: possuiUploads ? getAuthHeader() : getHeaders(),
        body: possuiUploads ? toFormData(data) : JSON.stringify(data),
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

export async function aprovarOrcamento(id: string): Promise<Orcamento> {
    const response = await fetch(`${API_URL}/${id}/aprovar`, {
        method: "PATCH",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao aprovar orçamento");
    return response.json();
}

export async function rejeitarOrcamento(id: string): Promise<Orcamento> {
    const response = await fetch(`${API_URL}/${id}/rejeitar`, {
        method: "PATCH",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao rejeitar orçamento");
    return response.json();
}
