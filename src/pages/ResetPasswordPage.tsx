import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { redefinirSenha } from "../services/AuthService";
import logo from "../assets/Images/black-logo.png";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    const linkInvalido = !token || !email;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErro("");

        if (senha.length < 6) {
            setErro("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (senha !== confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        try {
            setLoading(true);
            await redefinirSenha(email!, token!, senha);
            setSucesso(true);
            setTimeout(() => navigate("/login"), 2500);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "";
            if (msg.includes("expirado")) {
                setErro("Este link expirou. Solicite uma nova recuperação de senha.");
            } else {
                setErro("Link inválido ou já utilizado. Solicite uma nova recuperação.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="screen-container" style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem" }}>
                <img src={logo} alt="SynapseForge" style={{ height: 60, marginBottom: "2rem" }} />

                {linkInvalido ? (
                    <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>❌</div>
                        <h2>Link inválido</h2>
                        <p className="error" style={{ marginBottom: "1.5rem" }}>
                            Este link de redefinição está incompleto ou inválido.
                        </p>
                        <button className="button" onClick={() => navigate("/recovery")}>
                            Solicitar nova recuperação
                        </button>
                    </div>
                ) : sucesso ? (
                    <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
                        <h2>Senha redefinida!</h2>
                        <p style={{ color: "var(--on-surface-variant)" }}>
                            Você já pode entrar com a nova senha. Redirecionando...
                        </p>
                    </div>
                ) : (
                    <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
                        <h2>Redefinir senha</h2>
                        <p style={{ color: "var(--on-surface-variant)", marginBottom: "1.5rem" }}>
                            Escolha uma nova senha para sua conta.
                        </p>

                        {erro && <p className="error" role="alert">{erro}</p>}

                        <div className="input-group">
                            <label htmlFor="senha">Nova senha</label>
                            <input
                                id="senha"
                                type="password"
                                placeholder="Digite a nova senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmarSenha">Confirmar senha</label>
                            <input
                                id="confirmarSenha"
                                type="password"
                                placeholder="Repita a nova senha"
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>

                        <button className="button" type="submit" disabled={loading || !senha || !confirmarSenha}>
                            {loading ? "Redefinindo..." : "Redefinir senha"}
                        </button>

                        <button type="button" className="login-link" onClick={() => navigate("/login")}>
                            Voltar ao login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;
