const API_URL = "http://localhost:8081/auth";
const USERS_URL = "http://localhost:8081/users";

export async function login(email: string, senha: string): Promise<{ access_token: string; user_id: string }> {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
    });

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    const data = await response.json();
    return { access_token: data.access_token, user_id: data.user_id };
}

interface RegisterData {
    nome: string;
    email: string;
    senha: string;
    role: string;
}

export async function register(user: RegisterData): Promise<{ mensagem: string }> {
    const response = await fetch(`${API_URL}/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
    });

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

export async function confirmarEmail(token: string, signal?: AbortSignal): Promise<{ access_token: string; user_id: string }> {
    const response = await fetch(`${API_URL}/confirmar-email/${encodeURIComponent(token)}`, { signal });

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

export async function solicitarMudancaEmail(userId: string, novoEmail: string, token: string | null): Promise<{ mensagem: string }> {
    const response = await fetch(`${USERS_URL}/${encodeURIComponent(userId)}/solicitar-mudanca-email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ novoEmail })
    });

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

export async function confirmarMudancaEmail(token: string): Promise<{ mensagem: string }> {
    const response = await fetch(`${USERS_URL}/confirmar-mudanca-email/${encodeURIComponent(token)}`);

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}
