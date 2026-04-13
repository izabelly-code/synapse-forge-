import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { Pedido, PedidoStatus } from '../types';

const STATUS_SEQUENCE: PedidoStatus[] = ["MODELAGEM", "IMPRESSAO", "PINTURA", "ACABAMENTO", "FINALIZADO"];

const STATUS_LABELS: Record<PedidoStatus, string> = {
    MODELAGEM: "Modelagem",
    IMPRESSAO: "Impressão",
    PINTURA: "Pintura",
    ACABAMENTO: "Acabamento",
    FINALIZADO: "Finalizado",
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function isPrazoProximo(prazo: string): boolean {
    const diff = new Date(prazo).getTime() - Date.now();
    return diff < 3 * 24 * 60 * 60 * 1000;
}

interface ProgressBarProps {
    status: PedidoStatus;
}

function ProgressBar({ status }: ProgressBarProps) {
    const currentIndex = STATUS_SEQUENCE.indexOf(status);
    const progress = ((currentIndex + 1) / STATUS_SEQUENCE.length) * 100;

    return (
        <div className="pedido-progress">
            <div className="pedido-progress-labels">
                {STATUS_SEQUENCE.map((s, i) => (
                    <span
                        key={s}
                        className={
                            i < currentIndex
                                ? "progress-label done"
                                : i === currentIndex
                                ? "progress-label active"
                                : "progress-label"
                        }
                    >
                        {STATUS_LABELS[s]}
                    </span>
                ))}
            </div>
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

interface PedidoCardProps {
    pedido: Pedido;
    onAvancar: (id: string) => void;
    onDeletar: (id: string) => void;
    loading: boolean;
}

function PedidoCard({ pedido, onAvancar, onDeletar, loading }: PedidoCardProps) {
    const prazoProximo = isPrazoProximo(pedido.prazo);
    const finalizado = pedido.status === "FINALIZADO";
    const [confirmando, setConfirmando] = useState(false);

    return (
        <article className="pedido-card">
            <div className="pedido-card-header">
                <div>
                    <p className="pedido-cliente">{pedido.cliente}</p>
                    <h3 className="pedido-projeto">{pedido.projeto}</h3>
                </div>
                <span className={`pedido-chip ${finalizado ? "chip-done" : "chip-active"}`}>
                    {STATUS_LABELS[pedido.status]}
                </span>
            </div>

            {pedido.descricao && (
                <p className="pedido-descricao">{pedido.descricao}</p>
            )}

            <ProgressBar status={pedido.status} />

            <div className="pedido-card-footer">
                <div>
                    <p className="pedido-prazo-label">Prazo</p>
                    <p className={`pedido-prazo-value ${prazoProximo && !finalizado ? "prazo-urgente" : ""}`}>
                        {prazoProximo && !finalizado && (
                            <span className="urgente-dot" />
                        )}
                        {formatDate(pedido.prazo)}
                    </p>
                </div>

                <div className="pedido-footer-actions">
                    {!finalizado && (
                        <button
                            className="button pedido-btn-avancar"
                            onClick={() => onAvancar(pedido.id)}
                            disabled={loading}
                        >
                            {loading ? "Avançando..." : "Avançar →"}
                        </button>
                    )}
                    {confirmando ? (
                        <div className="delete-confirm">
                            <button className="delete-confirm-btn" onClick={() => onDeletar(pedido.id)}>Sim</button>
                            <button className="delete-cancel-btn" onClick={() => setConfirmando(false)}>Não</button>
                        </div>
                    ) : (
                        <button className="pedido-delete-btn" onClick={() => setConfirmando(true)} aria-label="Deletar pedido">
                            <FiTrash2 size={15} />
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}

export default PedidoCard;
