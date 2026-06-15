import { Outlet } from "react-router-dom";
import { getToken, isTokenExpired, clearSession } from "../../hooks/useAuth";
import StatusScreen from "./StatusScreen";

function ProtectedRoute() {
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

    return <Outlet />;
}

export default ProtectedRoute;
