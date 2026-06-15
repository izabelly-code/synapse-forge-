import { useNavigate } from "react-router-dom";
import logo from "../../assets/Images/black-logo.png";

interface StatusScreenProps {
    codigo?: string;
    titulo: string;
    descricao: string;
    acaoLabel: string;
    acaoDestino: string;
    secundariaLabel?: string;
    secundariaDestino?: string;
}

function StatusScreen({
    codigo,
    titulo,
    descricao,
    acaoLabel,
    acaoDestino,
    secundariaLabel,
    secundariaDestino,
}: StatusScreenProps) {
    const navigate = useNavigate();

    return (
        <div className="status-screen">
            <div className="status-card">
                <img
                    src={logo}
                    alt="SynapseForge"
                    className="status-logo"
                    onClick={() => navigate("/")}
                />

                {codigo && <span className="status-code">{codigo}</span>}

                <h1 className="status-title">{titulo}</h1>
                <p className="status-description">{descricao}</p>

                <div className="status-actions">
                    <button
                        type="button"
                        className="status-button"
                        onClick={() => navigate(acaoDestino)}
                    >
                        {acaoLabel}
                    </button>

                    {secundariaLabel && secundariaDestino && (
                        <button
                            type="button"
                            className="status-button-ghost"
                            onClick={() => navigate(secundariaDestino)}
                        >
                            {secundariaLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StatusScreen;
