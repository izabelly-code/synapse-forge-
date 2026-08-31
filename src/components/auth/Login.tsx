import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { login } from "../../services/AuthService";
import { ViewIcon, ViewOffSlashIcon } from "hugeicons-react";
import logo from "../../assets/Images/white-logo.png";
import LinkButton from "../ui/LinkButton";
import LoadingButton from "../ui/LoadingButton";
import FieldMessage from "../ui/FieldMessage";

interface LoginProps {
    onLogin: (token: string) => void;
    goToRegister: () => void;
    goToRecovery: () => void;
}

function Login({ onLogin, goToRegister, goToRecovery }: LoginProps) {

    const { t, i18n } = useTranslation();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const [showSenha, setShowSenha] = useState(false);
    const [emailValido, setEmailValido] = useState(true);
    const [capsLock, setCapsLock] = useState(false);

    const emailRef = useRef<HTMLInputElement>(null);
    const senhaRef = useRef<HTMLInputElement>(null);

    function validarEmail(valor: string) {
        const regex = /\S+@\S+\.\S+/;
        return regex.test(valor);
    }

    // Valida "reward early, punish late": o erro só aparece ao sair do campo,
    // mas some a cada tecla assim que o e-mail fica válido.
    function handleEmailChange(valor: string) {
        setEmail(valor);
        if (!emailValido && (validarEmail(valor) || valor === "")) {
            setEmailValido(true);
        }
    }

    function handleEmailBlur() {
        setEmailValido(validarEmail(email) || email === "");
    }

    function handleCapsLock(e: React.KeyboardEvent<HTMLInputElement>) {
        setCapsLock(e.getModifierState("CapsLock"));
    }

    async function handleLogin(e?: React.FormEvent) {
        if (e) e.preventDefault();

        setErro("");

        if (!email) {
            setErro(t("login.errorEmailRequired"));
            emailRef.current?.focus();
            return;
        }

        if (!validarEmail(email)) {
            setErro(t("login.errorEmailInvalid"));
            emailRef.current?.focus();
            return;
        }

        if (!senha) {
            setErro(t("login.errorPasswordRequired"));
            senhaRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            const { access_token, user_id } = await login(email, senha);
            localStorage.setItem("token", access_token);
            localStorage.setItem("userId", user_id);
            localStorage.setItem("userEmail", email);
            onLogin(access_token);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "";
            if (msg === "EMAIL_NAO_CONFIRMADO") {
                setErro(t("login.errorEmailNotConfirmed"));
            } else if (msg.startsWith("CONTA_BLOQUEADA")) {
                const minutos = Number(msg.split(":")[1]) || 15;
                setErro(t("login.errorAccountLocked", { count: minutos }));
            } else {
                setErro(t("login.errorGeneric"));
            }
            senhaRef.current?.focus();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="screen-container">

            {/* LEFT SIDE */}
            <div className="left-side">
                <div className="left-overlay"></div>

                <img src={logo} alt={t("login.logoAlt")} className="logo" />

                <div className="left-content">
                    <h1>{t("login.welcomeTitle")}</h1>
                    <p>{t("login.welcomeSubtitle")}</p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="right-side">
                <form className="card" onSubmit={handleLogin}>

                    {/* IDIOMA */}
                    <div className="lang-switch" role="group" aria-label="Idioma / Language">
                        <button
                            type="button"
                            className={i18n.language === "pt-BR" ? "active" : ""}
                            onClick={() => i18n.changeLanguage("pt-BR")}
                        >
                            PT
                        </button>
                        <span aria-hidden="true">|</span>
                        <button
                            type="button"
                            className={i18n.language === "en-US" ? "active" : ""}
                            onClick={() => i18n.changeLanguage("en-US")}
                        >
                            EN
                        </button>
                    </div>

                    <h2>{t("login.title")}</h2>

                    {/* ERRO */}
                    {erro && <p className="error">{erro}</p>}

                    {/* EMAIL */}
                    <div className="input-group">
                        <label htmlFor="email">{t("login.emailLabel")}</label>
                        <input
                            ref={emailRef}
                            id="email"
                            type="email"
                            placeholder={t("login.emailPlaceholder")}
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            onBlur={handleEmailBlur}
                            className={!emailValido ? "input-error" : ""}
                            aria-invalid={!emailValido}
                            aria-describedby="login-email-erro"
                        />
                        <FieldMessage id="login-email-erro" error={emailValido ? undefined : t("login.emailInvalid")} />
                    </div>

                    {/* SENHA */}
                    <div className="input-group">
                        <label htmlFor="senha">{t("login.passwordLabel")}</label>

                        <div className="input-wrapper">
                            <input
                                ref={senhaRef}
                                id="senha"
                                type={showSenha ? "text" : "password"}
                                placeholder={t("login.passwordPlaceholder")}
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                onKeyUp={handleCapsLock}
                                onKeyDown={handleCapsLock}
                            />

                            <button
                                type="button"
                                className="input-icon"
                                onClick={() => setShowSenha(!showSenha)}
                                aria-label={showSenha ? t("login.hidePassword") : t("login.showPassword")}
                            >
                                {showSenha
                                    ? <ViewOffSlashIcon />
                                    : <ViewIcon />}
                            </button>
                        </div>

                        {/* Slot de altura reservada: o aviso não empurra o botão para baixo. */}
                        <span className="input-hint">
                            {capsLock && <span className="warning-text">{t("login.capsLock")}</span>}
                        </span>
                    </div>

                    {/* BOTÃO */}
                    <LoadingButton pending={loading} pendingLabel={t("login.submitting")}>
                        {t("login.submit")}
                    </LoadingButton>

                    {/* LINKS */}
                    <LinkButton onClick={goToRegister}>
                        {t("login.registerLink")}
                    </LinkButton>

                    <LinkButton onClick={goToRecovery}>
                        {t("login.forgotPassword")}
                    </LinkButton>

                </form>
            </div>

        </div>
    );
}

export default Login;
