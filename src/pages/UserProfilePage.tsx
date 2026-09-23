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
import { useTranslation } from "react-i18next";

function UserProfilePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const token = localStorage.getItem("token");

    const [nome, setNome] = useState("");
    const [, setEmail] = useState("");
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
                        t("perfil.errors.loadData")
                    );
                }
            })
            .catch(() => {
                setErro(
                    t("perfil.errors.connection")
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token, navigate, t]);

    function getInitial() {
        return nome ? nome.charAt(0).toUpperCase() : "?";
    }

    async function handleSalvarDados(e: React.FormEvent) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        if (!nome.trim()) {
            setErro(t("perfil.errors.nameRequired"));
            return;
        }

        if (novaSenha || confirmarSenha) {
            if (!senhaAtual) {
                setErro(t("perfil.errors.currentPasswordRequired"));
                return;
            }

            if (novaSenha.length < 6) {
                setErro(t("perfil.errors.passwordTooShort"));
                return;
            }

            if (novaSenha !== confirmarSenha) {
                setErro(t("perfil.errors.passwordsMismatch"));
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

            setSucesso(t("perfil.success.saved"));

            setSenhaAtual("");
            setNovaSenha("");
            setConfirmarSenha("");

        } catch {
            setErro(
                t("perfil.errors.save")
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
            setErroEmail(t("perfil.errors.invalidEmail"));
            return;
        }

        if (novoEmail === emailOriginal) {
            setErroEmail(t("perfil.errors.sameEmail"));
            return;
        }

        const userId = localStorage.getItem("userId");

        if (!userId) {
            setErroEmail(
                t("perfil.errors.accountNotFound")
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
                t("perfil.success.emailSent", { email: novoEmail })
            );

        } catch (error) {

            const msg =
                error instanceof Error
                    ? error.message
                    : "";

            setErroEmail(
                msg.includes("uso")
                    ? t("perfil.errors.emailInUse")
                    : t("perfil.errors.requestEmail")
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
                        {t("perfil.sections.personalData")}
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
                            {t("perfil.fields.name")}
                        </label>

                        <input
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(e) =>
                                setNome(e.target.value)
                            }
                            placeholder={t("perfil.fields.namePlaceholder")}
                        />
                    </div>


                    <h2
                        className="profile-section-title"
                        style={{ marginTop: "1.5rem" }}
                    >
                        {t("perfil.sections.changePassword")}{" "}
                        <span className="label-opcional">
                            {t("perfil.sections.optional")}
                        </span>
                    </h2>


                    <div className="input-group">
                        <label htmlFor="senhaAtual">
                            {t("perfil.fields.currentPassword")}
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
                        >
                            <label htmlFor="novaSenha">
                                {t("perfil.fields.newPassword")}
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
                        >
                            <label htmlFor="confirmarSenha">
                                {t("perfil.fields.confirmPassword")}
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
                                        {t("perfil.errors.passwordsMismatchInline")}
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
                            {t("perfil.actions.cancel")}
                        </button>

                        <button
                            type="submit"
                            className="button"
                            disabled={saving}
                        >
                            {saving
                                ? t("perfil.actions.saving")
                                : t("perfil.actions.saveChanges")
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
                        {t("perfil.sections.changeEmail")}
                    </h2>

                    <p className="profile-email-atual">
                        {t("perfil.email.current")}{" "}
                        <strong>
                            {emailOriginal}
                        </strong>
                    </p>


                    {emailPendente
                        && !sucessoEmail
                        && (
                            <div className="profile-email-pendente">
                                {t("perfil.email.pending")}{" "}
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
                            {t("perfil.fields.newEmail")}
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
                            placeholder={t("perfil.fields.newEmailPlaceholder")}
                        />

                    </div>


                    <div className="profile-actions">

                        <button
                            type="submit"
                            className="button"
                            disabled={savingEmail}
                        >
                            {savingEmail
                                ? t("perfil.actions.sending")
                                : t("perfil.actions.sendConfirmation")
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
                        {t("perfil.email.hint")}
                    </p>

                </form>

            </div>
        </main>
    );
}

export default UserProfilePage;