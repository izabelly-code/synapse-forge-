import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    getMyUser,
    updateMyUser
} from "../services/UserService";
import { solicitarMudancaEmail } from "../services/AuthService";
import { ViewIcon, ViewOffSlashIcon } from "hugeicons-react";
import { avatarPalette } from "../utils/avatarPalette";
import { cn } from "../utils/cn";

function UserProfilePage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [emailOriginal, setEmailOriginal] = useState("");
    const [novoEmail, setNovoEmail] = useState("");
    const [emailPendente, setEmailPendente] = useState("");

    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [showSenhaAtual, setShowSenhaAtual] = useState(false);
    const [showNovaSenha, setShowNovaSenha] = useState(false);
    const [showConfirmar, setShowConfirmar] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [erroEmail, setErroEmail] = useState("");
    const [sucessoEmail, setSucessoEmail] = useState("");

    const novoEmailRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        getMyUser(token)
            .then((user) => {
                if (user) {
                    setNome(user.nome ?? "");
                    setEmail(user.email ?? "");
                    setEmailOriginal(user.email ?? "");
                } else {
                    setErro(
                        "Não foi possível carregar seus dados. Tente fazer login novamente."
                    );
                }
            })
            .catch(() => {
                setErro(
                    "Erro de conexão. Verifique se o servidor está rodando."
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token, navigate]);

    function getInitial() {
        return nome ? nome.charAt(0).toUpperCase() : "?";
    }

    async function handleSalvarDados(e: React.FormEvent) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        if (!nome.trim()) {
            setErro("O nome não pode ficar vazio.");
            return;
        }

        if (novaSenha || confirmarSenha) {
            if (!senhaAtual) {
                setErro("Digite sua senha atual para alterá-la.");
                return;
            }

            if (novaSenha.length < 6) {
                setErro("A nova senha deve ter ao menos 6 caracteres.");
                return;
            }

            if (novaSenha !== confirmarSenha) {
                setErro("As senhas não coincidem.");
                return;
            }
        }

        const payload: {
            nome: string;
            senha?: string;
        } = {
            nome: nome.trim()
        };

        if (novaSenha) {
            payload.senha = novaSenha;
        }

        try {
            setSaving(true);

            const atualizado = await updateMyUser(
                payload,
                token
            );

            setNome(atualizado.nome ?? nome);
            setEmail(atualizado.email ?? emailOriginal);
            setEmailOriginal(atualizado.email ?? emailOriginal);

            localStorage.setItem(
                "userNome",
                atualizado.nome ?? nome
            );

            localStorage.setItem(
                "userEmail",
                atualizado.email ?? emailOriginal
            );

            setSucesso("Dados atualizados com sucesso!");

            setSenhaAtual("");
            setNovaSenha("");
            setConfirmarSenha("");

        } catch {
            setErro(
                "Erro ao salvar. Verifique os dados e tente novamente."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleSolicitarEmail(e: React.FormEvent) {
        e.preventDefault();

        setErroEmail("");
        setSucessoEmail("");

        if (
            !novoEmail.trim()
            || !/\S+@\S+\.\S+/.test(novoEmail)
        ) {
            setErroEmail("Digite um email válido.");
            return;
        }

        if (novoEmail === emailOriginal) {
            setErroEmail("O novo email é igual ao atual.");
            return;
        }

        const userId = localStorage.getItem("userId");

        if (!userId) {
            setErroEmail(
                "Não foi possível identificar sua conta."
            );
            return;
        }

        try {
            setSavingEmail(true);

            await solicitarMudancaEmail(
                userId,
                novoEmail,
                token
            );

            setEmailPendente(novoEmail);
            setNovoEmail("");

            setSucessoEmail(
                `Email de confirmação enviado para ${novoEmail}. Verifique sua caixa de entrada.`
            );

        } catch (error) {

            const msg =
                error instanceof Error
                    ? error.message
                    : "";

            setErroEmail(
                msg.includes("uso")
                    ? "Este email já está em uso."
                    : "Erro ao solicitar alteração. Tente novamente."
            );

        } finally {
            setSavingEmail(false);
        }
    }

    if (loading) {
        return (
            <main className="dashboard-main">
                <div className="profile-skeleton" />
            </main>
        );
    }

    return (
        <main className="dashboard-main">
            <div className="profile-page">

                <div className="profile-avatar-block">
                    <div
                        className={cn(
                            "profile-avatar",
                            avatarPalette(emailOriginal || nome)
                        )}
                    >
                        {getInitial()}
                    </div>

                    <div>
                        <h1
                            className="dashboard-title"
                            style={{ marginBottom: "0.25rem" }}
                        >
                            {nome}
                        </h1>

                        <p className="dashboard-subtitle">
                            {emailOriginal}
                        </p>
                    </div>
                </div>


                {/* =====================================================
                    DADOS PESSOAIS + SENHA
                ====================================================== */}

                <form
                    className="profile-card"
                    onSubmit={handleSalvarDados}
                    style={{ marginBottom: "1.25rem" }}
                >
                    <h2 className="profile-section-title">
                        Dados pessoais
                    </h2>

                    {erro && (
                        <p className="error">
                            {erro}
                        </p>
                    )}

                    {sucesso && (
                        <p className="success">
                            {sucesso}
                        </p>
                    )}

                    <div className="input-group">
                        <label htmlFor="nome">
                            Nome
                        </label>

                        <input
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(e) =>
                                setNome(e.target.value)
                            }
                            placeholder="Seu nome completo"
                        />
                    </div>


                    <h2
                        className="profile-section-title"
                        style={{ marginTop: "1.5rem" }}
                    >
                        Alterar senha{" "}
                        <span className="label-opcional">
                            (opcional)
                        </span>
                    </h2>


                    <div className="input-group">
                        <label htmlFor="senhaAtual">
                            Senha atual
                        </label>

                        <div className="input-wrapper">
                            <input
                                id="senhaAtual"
                                type={
                                    showSenhaAtual
                                        ? "text"
                                        : "password"
                                }
                                value={senhaAtual}
                                onChange={(e) =>
                                    setSenhaAtual(e.target.value)
                                }
                                placeholder="••••••••"
                            />

                            <button
                                type="button"
                                className="input-icon"
                                onClick={() =>
                                    setShowSenhaAtual(
                                        !showSenhaAtual
                                    )
                                }
                            >
                                {showSenhaAtual
                                    ? <ViewOffSlashIcon />
                                    : <ViewIcon />
                                }
                            </button>
                        </div>
                    </div>


                    <div className="profile-senha-row">

                        <div
                            className="input-group"
                            style={{ flex: 1 }}
                        >
                            <label htmlFor="novaSenha">
                                Nova senha
                            </label>

                            <div className="input-wrapper">
                                <input
                                    id="novaSenha"
                                    type={
                                        showNovaSenha
                                            ? "text"
                                            : "password"
                                    }
                                    value={novaSenha}
                                    onChange={(e) =>
                                        setNovaSenha(
                                            e.target.value
                                        )
                                    }
                                    placeholder="••••••••"
                                />

                                <button
                                    type="button"
                                    className="input-icon"
                                    onClick={() =>
                                        setShowNovaSenha(
                                            !showNovaSenha
                                        )
                                    }
                                >
                                    {showNovaSenha
                                        ? <ViewOffSlashIcon />
                                        : <ViewIcon />
                                    }
                                </button>
                            </div>
                        </div>


                        <div
                            className="input-group"
                            style={{ flex: 1 }}
                        >
                            <label htmlFor="confirmarSenha">
                                Confirmar senha
                            </label>

                            <div className="input-wrapper">
                                <input
                                    id="confirmarSenha"
                                    type={
                                        showConfirmar
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmarSenha}
                                    onChange={(e) =>
                                        setConfirmarSenha(
                                            e.target.value
                                        )
                                    }
                                    placeholder="••••••••"
                                    className={
                                        confirmarSenha
                                        && novaSenha !== confirmarSenha
                                            ? "input-error"
                                            : ""
                                    }
                                />

                                <button
                                    type="button"
                                    className="input-icon"
                                    onClick={() =>
                                        setShowConfirmar(
                                            !showConfirmar
                                        )
                                    }
                                >
                                    {showConfirmar
                                        ? <ViewOffSlashIcon />
                                        : <ViewIcon />
                                    }
                                </button>
                            </div>

                            {confirmarSenha
                                && novaSenha !== confirmarSenha
                                && (
                                    <span className="error-text">
                                        As senhas não coincidem
                                    </span>
                                )
                            }
                        </div>

                    </div>


                    <div className="profile-actions">

                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="button"
                            disabled={saving}
                            style={{ flex: 1 }}
                        >
                            {saving
                                ? "Salvando..."
                                : "Salvar alterações"
                            }
                        </button>

                    </div>

                </form>


                {/* =====================================================
                    ALTERAÇÃO DE EMAIL
                ====================================================== */}

                <form
                    className="profile-card"
                    onSubmit={handleSolicitarEmail}
                >

                    <h2 className="profile-section-title">
                        Alterar email
                    </h2>

                    <p className="profile-email-atual">
                        Email atual:{" "}
                        <strong>
                            {emailOriginal}
                        </strong>
                    </p>


                    {emailPendente
                        && !sucessoEmail
                        && (
                            <div className="profile-email-pendente">
                                ⏳ Confirmação pendente para{" "}
                                <strong>
                                    {emailPendente}
                                </strong>
                            </div>
                        )
                    }


                    {erroEmail && (
                        <p className="error">
                            {erroEmail}
                        </p>
                    )}

                    {sucessoEmail && (
                        <p className="success">
                            {sucessoEmail}
                        </p>
                    )}


                    <div className="input-group">

                        <label htmlFor="novoEmail">
                            Novo email
                        </label>

                        <input
                            ref={novoEmailRef}
                            id="novoEmail"
                            type="email"
                            value={novoEmail}
                            onChange={(e) =>
                                setNovoEmail(
                                    e.target.value
                                )
                            }
                            placeholder="novo@email.com"
                        />

                    </div>


                    <div className="profile-actions">

                        <button
                            type="submit"
                            className="button"
                            disabled={savingEmail}
                            style={{ flex: 1 }}
                        >
                            {savingEmail
                                ? "Enviando..."
                                : "Enviar confirmação"
                            }
                        </button>

                    </div>


                    <p
                        style={{
                            fontSize: "0.8125rem",
                            color: "var(--on-surface-variant)",
                            marginTop: "0.75rem",
                            marginBottom: 0
                        }}
                    >
                        Um email de confirmação será enviado para
                        o novo endereço. O email só muda após a
                        confirmação.
                    </p>

                </form>

            </div>
        </main>
    );
}

export default UserProfilePage;