import { Outlet } from "react-router-dom";
import {
    getToken,
    getUserRole,
    isTokenExpired,
    clearSession
} from "../../hooks/useAuth";
import StatusScreen from "./StatusScreen";

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

function ProtectedRoute({
    allowedRoles
}: ProtectedRouteProps) {

    const token = getToken();

    if (!token) {
        return (
            <StatusScreen
                titulo="Acesso restrito"
                descricao="Você precisa entrar na sua conta para acessar esta área."
                acaoLabel="Entrar"
                acaoDestino="/login"
                secundariaLabel="Voltar ao início"
                secundariaDestino="/"
            />
        );
    }

    if (isTokenExpired(token)) {

        clearSession();

        return (
            <StatusScreen
                titulo="Sessão expirada"
                descricao="Sua sessão expirou por inatividade. Entre novamente para continuar."
                acaoLabel="Entrar novamente"
                acaoDestino="/login"
                secundariaLabel="Voltar ao início"
                secundariaDestino="/"
            />
        );
    }

    if (allowedRoles && allowedRoles.length > 0) {

        const role = getUserRole();

        if (!role || !allowedRoles.includes(role)) {

            return (
                <StatusScreen
                    titulo="403 - Acesso negado"
                    descricao="Você não possui permissão para acessar esta página."
                    acaoLabel="Voltar para pedidos"
                    acaoDestino="/dashboard"
                    secundariaLabel="Voltar ao início"
                    secundariaDestino="/"
                />
            );
        }
    }

    return <Outlet />;
}

export default ProtectedRoute;