import { useState, useRef, useEffect } from "react";
import { register } from "../../services/AuthService";
import { FiEye, FiEyeOff } from "react-icons/fi";
import logo from "../../assets/Images/white-logo.png";

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
    const [emailCadastrado, setEmailCadastrado] = useState("");

    const [showSenha, setShowSenha] = useState(false);
    const [emailValido, setEmailValido] = useState(true);
    const [cpfValido, setCpfValido] = useState(true);
    const [telefoneValido, setTelefoneValido] = useState(true);

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
            .replace(/\D/g, "")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
            .slice(0, 14);
    }

    function formatarTelefone(valor: string) {
        const numeros = valor.replace(/\D/g, "").slice(0, 11);

        if (numeros.length === 0) return "";
        if (numeros.length <= 2) return `(${numeros}`;
        if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }

    function validarCPF(cpf: string) {
        const cleanCpf = cpf.replace(/\D/g, "");

        if (cleanCpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cleanCpf)) return false;

        let soma = 0;
        let resto;

        for (let i = 0; i < 9; i++) {
            soma += parseInt(cleanCpf[i]) * (10 - i);
        }

        resto = (soma * 10) % 11;
        if (resto >= 10) resto = 0;
        if (resto !== parseInt(cleanCpf[9])) return false;

        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cleanCpf[i]) * (11 - i);
        }

        resto = (soma * 10) % 11;
        if (resto >= 10) resto = 0;

        return resto === parseInt(cleanCpf[10]);
    }

    function validarTelefone(telefone: string) {
        const numeros = telefone.replace(/\D/g, "");

        if (numeros.length < 10 || numeros.length > 11) return false;

        const ddd = numeros.slice(0, 2);
        const numero = numeros.slice(2);

        const dddsValidos = ["11","12","13","14","15","16","17","18","19","21","22","24","27","28","31","32","33","34","35","37","38","41","42","43","44","45","46","47","48","49","51","53","54","55","61","62","64","63","65","66","67","68","69","71","73","74","75","77","79","81","87","82","83","84","85","88","86","89","91","93","94","92","97","95","96","98","99"];

        if (!dddsValidos.includes(ddd)) return false;
        if (/^(\d)\1+$/.test(numeros)) return false;
        if (numeros.length === 11 && !numero.startsWith("9")) return false;

        return true;
    }

    const nivelSenha = forcaSenha(senha);

    async function handleRegister(e?: React.FormEvent) {
        if (e) e.preventDefault();

        setErro("");
        setSucesso("");

        if (!nome.trim()) return setErro("Por favor, informe seu nome.");
        if (nome.trim().length < 3) return setErro("O nome deve ter pelo menos 3 caracteres.");

        if (!email) return setErro("Por favor, informe seu email.");
        if (!validarEmail(email)) return setErro("Digite um email válido (ex: nome@email.com).");

        const cpfNum = cpf.replace(/\D/g, "");
        if (cpfNum.length < 11) return setErro("CPF incompleto.");
        if (!validarCPF(cpf)) return setErro("CPF inválido. Verifique os números digitados.");

        const telNum = telefone.replace(/\D/g, "");
        if (telNum.length < 10) return setErro("Telefone incompleto.");
        if (!validarTelefone(telefone)) return setErro("Telefone inválido. Verifique DDD e número.");

        if (!senha) return setErro("Crie uma senha.");
        if (senha.length < 6) return setErro("A senha deve ter no mínimo 6 caracteres.");

        if (!confirmSenha) return setErro("Confirme sua senha.");
        if (senha !== confirmSenha) return setErro("As senhas não coincidem.");

        try {
            setLoading(true);

            await register({
                nome,
                email,
                senha,
                role: "CLIENTE"
            });

            setEmailCadastrado(email);

        } catch (error) {
            const msg = error instanceof Error ? error.message : "";
            setErro(msg.includes("já cadastrado") ? "Este email já está cadastrado." : "Erro ao cadastrar. Tente novamente em instantes.");
        } finally {
            setLoading(false);
        }
    }

    if (emailCadastrado) {
        return (
            <div className="screen-container">
                <div className="left-side">
                    <div className="left-overlay"></div>
                    <img src={logo} alt="Logo SynapseForge" className="logo" />
                    <div className="left-content">
                        <h1>Quase lá!</h1>
                        <p>Confirme seu email para começar a usar a plataforma.</p>
                    </div>
                </div>
                <div className="right-side">
                    <div className="card" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📧</div>
                        <h2>Verifique seu email</h2>
                        <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                            Enviamos um link de confirmação para<br />
                            <strong style={{ color: "var(--on-background)" }}>{emailCadastrado}</strong>
                        </p>
                        <p style={{ color: "var(--on-surface-variant)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                            Clique no link do email para ativar sua conta e entrar automaticamente.
                        </p>
                        <button type="button" className="link" onClick={onRegister}>
                            Voltar para o login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="screen-container">

            <div className="left-side">
                <div className="left-overlay"></div>
                <img src={logo} alt="Logo SynapseForge" className="logo" />

                <div className="left-content">
                    <h1>Crie sua conta</h1>
                    <p>Comece agora e aproveite todos os recursos.</p>
                </div>
            </div>

            <div className="right-side">
                <form className="card card-wide" onSubmit={handleRegister}>

                    <h2>Cadastro</h2>

                    {erro && <p className="error">{erro}</p>}
                    {sucesso && <p className="success">{sucesso}</p>}

                    <div className="input-group">
                        <label>Nome</label>
                        <input
                            ref={nomeRef}
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Digite seu nome"
                        />
                        <span className="input-hint">
                            {nome && nome.length < 3 && (
                                <span className="error-text">Nome muito curto</span>
                            )}
                        </span>
                    </div>

                    <div className="input-group">
                        <label>Email</label>
                        <input
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailValido(validarEmail(e.target.value) || e.target.value === "");
                            }}
                            className={!emailValido ? "input-error" : ""}
                            placeholder="Digite seu email"
                        />
                        <span className="input-hint">
                            {email && !emailValido && (
                                <span className="error-text">Formato inválido (ex: nome@email.com)</span>
                            )}
                        </span>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>CPF</label>
                            <input
                                value={cpf}
                                onChange={(e) => {
                                    const valor = formatarCPF(e.target.value);
                                    setCpf(valor);

                                    const numeros = valor.replace(/\D/g, "");
                                    if (numeros.length === 11) {
                                        setCpfValido(validarCPF(valor));
                                    }
                                }}
                                className={!cpfValido ? "input-error" : ""}
                                placeholder="000.000.000-00"
                            />
                            <span className="input-hint">
                                {!cpfValido ? (
                                    <span className="error-text">CPF inválido</span>
                                ) : cpf && cpf.replace(/\D/g, "").length < 11 ? (
                                    <span className="error-text">CPF incompleto</span>
                                ) : null}
                            </span>
                        </div>

                        <div className="input-group">
                            <label>Telefone</label>
                            <input
                                value={telefone}
                                onChange={(e) => {
                                    const valor = formatarTelefone(e.target.value);
                                    setTelefone(valor);

                                    const numeros = valor.replace(/\D/g, "");
                                    if (numeros.length >= 10) {
                                        setTelefoneValido(validarTelefone(valor));
                                    }
                                }}
                                className={!telefoneValido ? "input-error" : ""}
                                placeholder="(00) 00000-0000"
                            />
                            <span className="input-hint">
                                {!telefoneValido ? (
                                    <span className="error-text">DDD/número inválido</span>
                                ) : telefone && telefone.replace(/\D/g, "").length < 10 ? (
                                    <span className="error-text">Telefone incompleto</span>
                                ) : null}
                            </span>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>Senha</label>
                            <div className="input-wrapper">
                                <input
                                    type={showSenha ? "text" : "password"}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    placeholder="Digite sua senha"
                                />
                                <button
                                    type="button"
                                    className="input-icon"
                                    onClick={() => setShowSenha(!showSenha)}
                                >
                                    {showSenha ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            <span className="input-hint">
                                {senha && (
                                    <span className={`senha-${nivelSenha}`}>
                                        {nivelSenha === "fraca" && "Senha fraca"}
                                        {nivelSenha === "media" && "Senha média"}
                                        {nivelSenha === "forte" && "Senha forte"}
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="input-group">
                            <label>Confirmar senha</label>
                            <input
                                type="password"
                                value={confirmSenha}
                                onChange={(e) => setConfirmSenha(e.target.value)}
                                placeholder="Repita sua senha"
                            />
                            <span className="input-hint">
                                {confirmSenha && senha !== confirmSenha && (
                                    <span className="error-text">Senhas não coincidem</span>
                                )}
                            </span>
                        </div>
                    </div>

                    <button className="button" type="submit" disabled={loading}>
                        {loading ? "Cadastrando..." : "Cadastrar"}
                    </button>

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
