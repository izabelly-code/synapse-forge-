import StatusScreen from "../components/auth/StatusScreen";

function SessionExpiredPage() {
    return (
        <StatusScreen
            titulo="Sessão expirada"
            descricao="Sua sessão expirou ou foi encerrada. Entre novamente para continuar."
            acaoLabel="Entrar novamente"
            acaoDestino="/login"
            secundariaLabel="Voltar ao início"
            secundariaDestino="/"
        />
    );
}

export default SessionExpiredPage;
