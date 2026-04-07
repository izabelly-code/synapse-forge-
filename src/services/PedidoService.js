const API_URL = "http://localhost:8081/pedidos";

function getHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getPedidos(status) {
    const url = status ? `${API_URL}?status=${status}` : API_URL;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error("Falha ao buscar pedidos");
    return response.json();
}

export async function avancarStatus(id) {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Falha ao avançar status");
    return response.json();
}

export async function criarPedido(data) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Falha ao criar pedido");
    return response.json();
}
