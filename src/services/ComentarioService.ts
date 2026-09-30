import {
    Comentario,
    ComentarioRequest
} from "../types";

const API_URL = "http://localhost:8081/pedidos";

function getHeaders(): Record<string, string> {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}


export async function getComentarios(
    pedidoId: string
): Promise<Comentario[]> {

    const response = await fetch(
        `${API_URL}/${pedidoId}/comentarios`,
        {
            method: "GET",
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Falha ao buscar comentários"
        );
    }

    return response.json();
}


export async function criarComentario(
    pedidoId: string,
    data: ComentarioRequest
): Promise<Comentario> {

    const response = await fetch(
        `${API_URL}/${pedidoId}/comentarios`,
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Falha ao criar comentário"
        );
    }

    return response.json();
}