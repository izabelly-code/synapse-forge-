import { getToken, clearSession, isTokenExpired } from "../hooks/useAuth";

const API_BASE = "http://localhost:8081";

/** Disparado quando o back nega uma ação (403) a um usuário com sessão válida. */
export const EVENTO_SEM_PERMISSAO = "sf:sem-permissao";

let installed = false;
let redirecionando = false;

function resolveUrl(input: RequestInfo | URL): string {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.toString();
    if (input instanceof Request) return input.url;
    return String(input);
}

function encerrarSessao(): void {
    if (redirecionando) return;
    redirecionando = true;
    clearSession();
    window.location.assign("/sessao-expirada");
}

export function installHttpInterceptor(): void {
    if (installed) return;
    installed = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const response = await originalFetch(input, init);

        const url = resolveUrl(input);
        const token = getToken();
        if (!url.startsWith(API_BASE) || url.includes("/auth/") || !token) return response;

        // SYN-100: 403 com SEM_EQUIPE não é sessão inválida, é usuário sem equipe.
        // Leva para a página de Equipe (onde ele cria ou aguarda um convite) sem deslogar.
        if (response.status === 403 && response.headers.get("X-Codigo-Erro") === "SEM_EQUIPE") {
            if (!window.location.pathname.startsWith("/equipe")) {
                window.location.assign("/equipe?semEquipe=1");
            }
            return response;
        }

        // 401 = token ausente, expirado ou inválido: a sessão acabou.
        // 403 = sessão válida sem permissão para a ação: avisa e mantém a pessoa logada.
        // (Um back anterior à SYN-102 devolvia 403 também para token expirado; o exp local cobre esse caso.)
        if (response.status === 401 || (response.status === 403 && isTokenExpired(token))) {
            encerrarSessao();
        } else if (response.status === 403) {
            window.dispatchEvent(new CustomEvent(EVENTO_SEM_PERMISSAO));
        }

        return response;
    };
}
