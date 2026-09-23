const API_URL = "http://localhost:8081/equipes/meu-convite";

/** Convite de equipe pendente do usuário logado (SYN-101). */
export interface MeuConvite {
    id: string;
    equipeId: string;
    equipeNome: string | null;
    gerenteNome: string | null;
    expiraEm: string | null;
}

function headers(token: string | null) {
    return { Authorization: `Bearer ${token}` };
}

/** null quando não há convite pendente (o backend responde 204). */
export async function buscarMeuConvite(token: string | null): Promise<MeuConvite | null> {
    const response = await fetch(API_URL, { headers: headers(token) });
    if (response.status === 204) return null;
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
}

/** Aceitar muda o papel (CLIENTE → TECNICO): o backend devolve um token novo. */
export async function aceitarMeuConvite(
    token: string | null
): Promise<{ access_token: string; user_id: string }> {
    const response = await fetch(`${API_URL}/aceitar`, { method: "POST", headers: headers(token) });
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
}

export async function recusarMeuConvite(token: string | null): Promise<void> {
    const response = await fetch(`${API_URL}/recusar`, { method: "POST", headers: headers(token) });
    if (!response.ok) throw new Error(await response.text());
}
