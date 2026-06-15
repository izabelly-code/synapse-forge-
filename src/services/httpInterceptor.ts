import { getToken, clearSession } from "../hooks/useAuth";

const API_BASE = "http://localhost:8081";

let installed = false;
let redirecionando = false;

function resolveUrl(input: RequestInfo | URL): string {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.toString();
    if (input instanceof Request) return input.url;
    return String(input);
}

export function installHttpInterceptor(): void {
    if (installed) return;
    installed = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const response = await originalFetch(input, init);

        const url = resolveUrl(input);
        const sessaoInvalida =
            (response.status === 401 || response.status === 403) &&
            url.startsWith(API_BASE) &&
            !url.includes("/auth/");

        if (sessaoInvalida && getToken() && !redirecionando) {
            redirecionando = true;
            clearSession();
            window.location.assign("/sessao-expirada");
        }

        return response;
    };
}
