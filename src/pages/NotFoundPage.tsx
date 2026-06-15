import { isAuthenticated } from "../hooks/useAuth";
import StatusScreen from "../components/auth/StatusScreen";

function NotFoundPage() {
    const logado = isAuthenticated();

    return (
        <StatusScreen
            codigo="404"
            titulo="Página não encontrada"
            descricao="A página que você procura não existe ou foi movida."
            acaoLabel={logado ? "Ir para o painel" : "Voltar ao início"}
            acaoDestino={logado ? "/dashboard" : "/"}
        />
    );
}

export default NotFoundPage;
