const API_URL = "http://localhost:8081/auth";
const USERS_URL = "http://localhost:8081/users";
const EQUIPES_URL = "http://localhost:8081/equipes";

// =========================================================
// LOGIN
// =========================================================

export async function login(
    email: string,
    senha: string
): Promise<{
    access_token: string;
    user_id: string;
}> {

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            senha
        })
    });

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    const data = await response.json();

    return {
        access_token: data.access_token,
        user_id: data.user_id
    };
}

// =========================================================
// DADOS DE CADASTRO
// =========================================================

interface RegisterData {
    nome: string;
    email: string;
    senha: string;
    cpf: string;
    telefone: string;
}

// =========================================================
// CADASTRO DE CLIENTE
// =========================================================

export async function register(
    user: RegisterData
): Promise<{
    mensagem: string;
}> {

    const response = await fetch(`${API_URL}/cadastro`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

// =========================================================
// CADASTRO DE GERENTE
// =========================================================

export async function registerGerente(
    user: RegisterData
): Promise<{
    mensagem: string;
}> {

    const response = await fetch(
        `${API_URL}/cadastro-gerente`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        }
    );

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

// =========================================================
// CONFIRMAR EMAIL
// =========================================================

export async function confirmarEmail(
    token: string,
    signal?: AbortSignal
): Promise<{
    access_token: string;
    user_id: string;
}> {

    const response = await fetch(
        `${API_URL}/confirmar-email/${encodeURIComponent(token)}`,
        {
            signal
        }
    );

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

// =========================================================
// ESQUECI A SENHA
// =========================================================

export async function esqueciSenha(
    email: string
): Promise<string> {

    const response = await fetch(
        `${API_URL}/esqueci-senha`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email
            })
        }
    );

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.text();
}

// =========================================================
// REDEFINIR SENHA
// =========================================================

export async function redefinirSenha(
    email: string,
    token: string,
    novaSenha: string
): Promise<string> {

    const response = await fetch(
        `${API_URL}/redefinir-senha`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                token,
                novaSenha
            })
        }
    );

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.text();
}

// =========================================================
// SOLICITAR MUDANÇA DE EMAIL
// =========================================================

export async function solicitarMudancaEmail(
    userId: string,
    novoEmail: string,
    token: string | null
): Promise<{
    mensagem: string;
}> {

    const response = await fetch(
        `${USERS_URL}/${encodeURIComponent(userId)}/solicitar-mudanca-email`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                novoEmail
            })
        }
    );

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

// =========================================================
// CONFIRMAR MUDANÇA DE EMAIL
// =========================================================

export async function confirmarMudancaEmail(
    token: string
): Promise<{
    mensagem: string;
}> {

    const response = await fetch(
        `${USERS_URL}/confirmar-mudanca-email/${encodeURIComponent(token)}`
    );

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

// =========================================================
// BUSCAR CONVITE DE EQUIPE
// =========================================================

export async function buscarConviteEquipe(
    token: string
) {

    const response = await fetch(
        `${EQUIPES_URL}/convites/${encodeURIComponent(token)}`
    );

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

// =========================================================
// ACEITAR CONVITE DE EQUIPE
// =========================================================

export async function aceitarConviteEquipe(
    token: string
) {

    const response = await fetch(
        `${EQUIPES_URL}/convites/${encodeURIComponent(token)}/aceitar`,
        {
            method: "POST"
        }
    );

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}

// =========================================================
// RECUSAR CONVITE DE EQUIPE
// =========================================================

export async function recusarConviteEquipe(
    token: string
) {

    const response = await fetch(
        `${EQUIPES_URL}/convites/${encodeURIComponent(token)}/recusar`,
        {
            method: "POST"
        }
    );

    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
    }

    return await response.json();
}