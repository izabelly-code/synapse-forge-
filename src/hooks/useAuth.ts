export function getToken(): string | null {
    return localStorage.getItem("token");
}

interface JwtPayload {
    sub?: string;
    role?: string;
    exp?: number;
    iat?: number;
}

function getTokenPayload(token: string): JwtPayload | null {
    try {
        const payload = token.split(".")[1];

        if (!payload) return null;

        const decoded = JSON.parse(
            atob(
                payload
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );

        return decoded;
    } catch {
        return null;
    }
}

function getTokenExpiration(token: string): number | null {
    const payload = getTokenPayload(token);

    return typeof payload?.exp === "number"
        ? payload.exp
        : null;
}

export function isTokenExpired(token: string): boolean {
    const exp = getTokenExpiration(token);

    if (exp === null) return false;

    return Date.now() >= exp * 1000;
}

export function isAuthenticated(): boolean {
    const token = getToken();

    if (!token) return false;

    return !isTokenExpired(token);
}

export function getUserRole(): string | null {
    const token = getToken();

    if (!token) return null;

    const payload = getTokenPayload(token);

    return payload?.role ?? null;
}

export function clearSession(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userNome");
    localStorage.removeItem("userEmail");
}