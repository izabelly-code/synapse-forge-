import { useState, useRef } from "react";
import { login } from "../services/AuthService";
import { FiEye, FiEyeOff } from "react-icons/fi";
import logo from "../assets/Images/white-logo.png";

interface LoginProps {
    onLogin: (token: string) => void;
    goToRegister: () => void;
    goToRecovery: () => void;
}

function Login({ onLogin, goToRegister, goToRecovery }: LoginProps) {

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

    function handleEmailChange(valor: string) {
        setEmail(valor);
        setEmailValido(validarEmail(valor) || valor === "");
    }

    function handleCapsLock(e: React.KeyboardEvent<HTMLInputElement>) {
        setCapsLock(e.getModifierState("CapsLock"));
    }

    async function handleLogin(e?: React.FormEvent) {
        if (e) e.preventDefault();

        setErro("");

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

        if (!senha) {
            setErro("Digite sua senha.");
            senhaRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            const { access_token, user_id } = await login(email, senha);
            localStorage.setItem("token", access_token);
            localStorage.setItem("userId", user_id);
            onLogin(access_token);
        } catch (error) {
            console.log(error);
            setErro("Não foi possível entrar. Verifique seus dados.");
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

                <img src={logo} alt="Logo SynapseForge" className="logo" />

                <div className="left-content">
                    <h1>Bem-vindo a Synapse Forge!</h1>
                    <p>Gerencie sua conta de forma simples e segura.</p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="right-side">
                <form className="card" onSubmit={handleLogin}>

                    <h2>Login</h2>

                    {/* ERRO */}
                    {erro && <p className="error">{erro}</p>}

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
                        />
                        {!emailValido && (
                            <span className="error-text">Email inválido</span>
                        )}
                    </div>

                    {/* SENHA */}
                    <div className="input-group">
                        <label htmlFor="senha">Senha</label>

                        <div className="input-wrapper">
                            <input
                                ref={senhaRef}
                                id="senha"
                                type={showSenha ? "text" : "password"}
                                placeholder="Digite sua senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                onKeyUp={handleCapsLock}
                                onKeyDown={handleCapsLock}
                            />

                            <button
                                type="button"
                                className="input-icon"
                                onClick={() => setShowSenha(!showSenha)}
                                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {showSenha
                                    ? <FiEyeOff className="text-gray-700" />
                                    : <FiEye className="text-gray-700" />}
                            </button>
                        </div>

                        {capsLock && (
                            <span className="warning-text">Caps Lock ativado</span>
                        )}
                    </div>

                    {/* BOTÃO */}
                    <button
                        className="button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>

                    {/* LINKS */}
                    <button
                        type="button"
                        className="register-link"
                        onClick={goToRegister}
                    >
                        Não tem conta? Cadastre-se
                    </button>

                    <button
                        type="button"
                        className="forgot-password-link"
                        onClick={goToRecovery}
                    >
                        Esqueci minha senha
                    </button>

                </form>
            </div>

        </div>
    );
}

export default Login;
