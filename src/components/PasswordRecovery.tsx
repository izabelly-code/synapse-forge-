import { useState, useRef, useEffect } from "react";
import logo from "../assets/images/white-logo.png";
import background from "../assets/images/background.jpg";

interface PasswordRecoveryProps {
    goToLogin: () => void;
}

function PasswordRecovery({ goToLogin }: PasswordRecoveryProps) {

    const [email, setEmail] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailValido, setEmailValido] = useState(true);

    const [timer, setTimer] = useState(0);

    const emailRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    // ⏱️ contador regressivo
    useEffect(() => {
        if (timer <= 0) return;

        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    function validarEmail(valor: string) {
        const regex = /\S+@\S+\.\S+/;
        return regex.test(valor);
    }

    function handleEmailChange(valor: string) {
        setEmail(valor);
        setEmailValido(validarEmail(valor) || valor === "");
    }

    async function enviarEmail() {
        // 👉 aqui vai sua API real
        await new Promise((res) => setTimeout(res, 1500));
    }

    async function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();

        setErro("");
        setSucesso("");

        if (!email) {
            setErro("Digite seu email.");
            emailRef.current?.focus();
            return;
        }

        if (!validarEmail(email)) {
            setErro("Email inválido.");
            emailRef.current?.focus();
            return;
        }

        try {
            setLoading(true);

            await enviarEmail();

            setSucesso(
                "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha."
            );

            setTimer(30); // inicia o timer

        } catch {
            setErro("Erro ao solicitar recuperação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    async function handleReenviar() {
        if (timer > 0) return;

        try {
            setLoading(true);
            await enviarEmail();
            setTimer(30);
        } catch {
            setErro("Erro ao reenviar email.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container">

            {/* LEFT SIDE */}
            <div className="left-side">
                <div className="left-overlay"></div>

                <img src={logo} alt="Logo SynapseForge" className="logo" />

                <div className="left-content">
                    <h1>Recuperação de senha</h1>
                    <p>Informe seu email para recuperar o acesso à sua conta.</p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="right-side">
                <form className="card" onSubmit={handleSubmit}>

                    <h2>Recuperar senha</h2>

                    {/* ERRO */}
                    {erro && <p className="error" role="alert">{erro}</p>}

                    {/* SUCESSO */}
                    {sucesso && (
                        <div className="success-box">
                            <p>{sucesso}</p>

                            <p className="spam-tip">
                                Não encontrou o email? Verifique sua caixa de spam.
                            </p>

                            <button
                                type="button"
                                className="resend-link"
                                onClick={handleReenviar}
                                disabled={timer > 0 || loading}
                            >
                                {timer > 0
                                    ? `Reenviar em ${timer}s`
                                    : "Reenviar email"}
                            </button>
                        </div>
                    )}

                    {/* EMAIL */}
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            ref={emailRef}
                            id="email"
                            type="email"
                            placeholder="Digite seu email"
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            className={!emailValido ? "input-error" : ""}
                            autoComplete="email"
                        />
                        {!emailValido && (
                            <span className="error-text">
                                Email inválido
                            </span>
                        )}
                    </div>

                    {/* BOTÃO */}
                    <button
                        className="button"
                        type="submit"
                        disabled={loading || !email}
                    >
                        {loading ? "Enviando..." : "Enviar"}
                    </button>

                    {/* VOLTAR */}
                    <button
                        type="button"
                        className="login-link"
                        onClick={goToLogin}
                    >
                        Voltar ao login
                    </button>

                </form>
            </div>

        </div>
    );
}

export default PasswordRecovery;