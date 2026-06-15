export function getToken(): string | null {
    return localStorage.getItem("token");
}

function getTokenExpiration(token: string): number | null {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return typeof decoded.exp === "number" ? decoded.exp : null;
    } catch {
        return null;
    }
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

export function clearSession(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userNome");
    localStorage.removeItem("userEmail");
}
