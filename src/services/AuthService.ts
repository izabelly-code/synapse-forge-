const API_URL = "http://localhost:8081/auth";

export async function login(email: string, senha: string): Promise<string> {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, senha })
    });

    const data = await response.json();
    return data.access_token;
}

interface RegisterData {
    nome: string;
    email: string;
    senha: string;
    role: string;
}

export async function register(user: RegisterData): Promise<unknown> {
    const response = await fetch(`${API_URL}/cadastro`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    return await response.json();
}
