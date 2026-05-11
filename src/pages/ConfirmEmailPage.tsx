import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmarEmail } from "../services/AuthService";
import logo from "../assets/Images/black-logo.png";

function ConfirmEmailPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (!token) {
            setErro("Link inválido.");
            setStatus("error");
            return;
        }

        const controller = new AbortController();

        confirmarEmail(token, controller.signal)
            .then(({ access_token, user_id }) => {
                localStorage.setItem("token", access_token);
                localStorage.setItem("userId", user_id);
                setStatus("success");
                setTimeout(() => navigate("/dashboard"), 2000);
            })
            .catch((error) => {
                if (error.name === "AbortError") return;
                const msg = error instanceof Error ? error.message : "";
                if (msg.includes("expirado")) {
                    setErro("Este link expirou. Crie uma nova conta.");
                } else {
                    setErro("Link inválido ou já utilizado.");
                }
                setStatus("error");
            });

        return () => controller.abort();
    }, [token, navigate]);

    return (
        <div className="screen-container" style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem" }}>
                <img src={logo} alt="SynapseForge" style={{ height: 60, marginBottom: "2rem" }} />

                {status === "loading" && (
                    <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
                        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                        <h2>Confirmando seu email...</h2>
                        <p style={{ color: "var(--on-surface-variant)" }}>Aguarde um momento.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
                        <h2>Email confirmado!</h2>
                        <p style={{ color: "var(--on-surface-variant)", marginBottom: "1.5rem" }}>
                            Sua conta está ativa. Redirecionando para o dashboard...
                        </p>
                    </div>
                )}

                {status === "error" && (
                    <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>❌</div>
                        <h2>Não foi possível confirmar</h2>
                        <p className="error" style={{ marginBottom: "1.5rem" }}>{erro}</p>
                        <button className="button" onClick={() => navigate("/register")}>
                            Criar nova conta
                        </button>
                        <button type="button" className="link" onClick={() => navigate("/login")}>
                            Voltar para o login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConfirmEmailPage;
