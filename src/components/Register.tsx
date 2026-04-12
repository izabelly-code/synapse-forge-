import { useState, useRef, useEffect } from "react";
import { register } from "../services/AuthService";
import { FiEye, FiEyeOff } from "react-icons/fi";
import logo from "../assets/images/white-logo.png";
import background from "../assets/images/background.jpg";

interface RegisterProps {
    onRegister: () => void;
}

function Register({ onRegister }: RegisterProps) {

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmSenha, setConfirmSenha] = useState("");
    const [cpf, setCpf] = useState("");
    const [telefone, setTelefone] = useState("");

    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [loading, setLoading] = useState(false);

    const [showSenha, setShowSenha] = useState(false);
    const [emailValido, setEmailValido] = useState(true);

    const nomeRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        nomeRef.current?.focus();
    }, []);

    function validarEmail(valor: string) {
        return /\S+@\S+\.\S+/.test(valor);
    }

    function forcaSenha(senha: string) {
        if (senha.length < 6) return "fraca";
        if (senha.match(/[A-Z]/) && senha.match(/[0-9]/)) return "forte";
        return "media";
    }

    function formatarCPF(valor: string) {
    return valor
        .replace(/\D/g, "") // remove tudo que não é número
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
    }

    function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length === 0) {
        return "";
    }

    if (numeros.length <= 2) {
        return `(${numeros}`;
    }

    if (numeros.length <= 7) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }

    const nivelSenha = forcaSenha(senha);

    async function handleRegister(e?: React.FormEvent) {
        if (e) e.preventDefault();

        setErro("");
        setSucesso("");

        if (!nome) return setErro("Digite seu nome.");
        if (!email || !validarEmail(email)) return setErro("Email inválido.");
        if (!senha) return setErro("Digite sua senha.");
        if (senha !== confirmSenha) return setErro("As senhas não coincidem.");

        try {
            setLoading(true);

            await register({
                nome,
                email,
                senha,
                role: "CLIENTE"
            });

            setSucesso("Conta criada com sucesso!");
            setTimeout(onRegister, 1500);

        } catch {
            setErro("Erro ao cadastrar. Tente novamente.");
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
                    <h1>Crie sua conta</h1>
                    <p>Comece agora e aproveite todos os recursos.</p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="right-side">
                <form className="card" onSubmit={handleRegister}>

                    <h2>Cadastro</h2>

                    {erro && <p className="error" role="alert">{erro}</p>}
                    {sucesso && <p className="success">{sucesso}</p>}

                    {/* NOME */}
                    <div className="input-group">
                        <label htmlFor="nome">Nome</label>
                        <input
                            ref={nomeRef}
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Digite seu nome"
                        />
                    </div>

                    {/* EMAIL */}
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailValido(validarEmail(e.target.value) || e.target.value === "");
                            }}
                            className={!emailValido ? "input-error" : ""}
                            placeholder="Digite seu email"
                            autoComplete="email"
                        />
                        {!emailValido && <span className="error-text">Email inválido</span>}
                    </div>

                    {/* CPF */}
                    <div className="input-group">
                        <label>CPF</label>
                        <input
                            value={cpf}
                            onChange={(e) => setCpf(formatarCPF(e.target.value))}
                            placeholder="000.000.000-00"
                        />
                    </div>

                    {/* TELEFONE */}
                    <div className="input-group">
                        <label>Telefone</label>
                        <input
                            value={telefone}
                            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    {/* SENHA */}
                    <div className="input-group">
                        <label>Senha</label>

                        <div className="input-wrapper">
                            <input
                                type={showSenha ? "text" : "password"}
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="Digite sua senha"
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                className="input-icon"
                                onClick={() => setShowSenha(!showSenha)}
                                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {showSenha ? <FiEyeOff color="white" /> : <FiEye color="white" />}
                            </button>
                        </div>

                        {senha && (
                            <span className={`senha-${nivelSenha}`}>
                                {nivelSenha === "fraca" && "Senha fraca"}
                                {nivelSenha === "media" && "Senha média"}
                                {nivelSenha === "forte" && "Senha forte"}
                            </span>
                        )}
                    </div>

                    {/* CONFIRMAR SENHA */}
                    <div className="input-group">
                        <label>Confirmar senha</label>
                        <input
                            type="password"
                            value={confirmSenha}
                            onChange={(e) => setConfirmSenha(e.target.value)}
                            placeholder="Repita sua senha"
                        />
                        {confirmSenha && senha !== confirmSenha && (
                            <span className="error-text">
                                Senhas não coincidem
                            </span>
                        )}
                    </div>

                    {/* BOTÃO */}
                    <button
                        className="button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Cadastrando..." : "Cadastrar"}
                    </button>

                    {/* VOLTAR */}
                    <button
                        type="button"
                        className="login-link"
                        onClick={onRegister}
                    >
                        Já tem conta? Voltar para login
                    </button>

                </form>
            </div>

        </div>
    );
}

export default Register;