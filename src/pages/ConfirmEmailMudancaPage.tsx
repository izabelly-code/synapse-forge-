import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmarMudancaEmail } from "../services/AuthService";
import logo from "../assets/Images/black-logo.png";

function ConfirmEmailMudancaPage() {
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

        confirmarMudancaEmail(token)
            .then(() => {
                setStatus("success");
            })
            .catch((error) => {
                const msg = error instanceof Error ? error.message : "";
                if (msg.includes("expirado")) {
                    setErro("Este link expirou. Solicite a alteração novamente.");
                } else {
                    setErro("Link inválido ou já utilizado.");
                }
                setStatus("error");
            });
    }, [token]);

    return (
        <div className="screen-container" style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem" }}>
                <img src={logo} alt="SynapseForge" style={{ height: 60, marginBottom: "2rem" }} />

                {status === "loading" && (
                    <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
                        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                        <h2>Confirmando alteração...</h2>
                        <p style={{ color: "var(--on-surface-variant)" }}>Aguarde um momento.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
                        <h2>Email alterado!</h2>
                        <p style={{ color: "var(--on-surface-variant)", marginBottom: "1.5rem" }}>
                            Seu email foi atualizado com sucesso.
                        </p>
                        <button className="button" onClick={() => navigate("/perfil")}>
                            Ir para o perfil
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>❌</div>
                        <h2>Não foi possível confirmar</h2>
                        <p className="error" style={{ marginBottom: "1.5rem" }}>{erro}</p>
                        <button className="button" onClick={() => navigate("/perfil")}>
                            Voltar para o perfil
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConfirmEmailMudancaPage;
