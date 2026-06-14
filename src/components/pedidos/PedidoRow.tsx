import { useEffect, useRef, useState } from 'react';
import { FiTrash2, FiArrowRight, FiArrowLeft, FiCheck, FiMoreVertical } from 'react-icons/fi';
import { Pedido, PedidoStatus } from '../../types';

const STATUS_SEQUENCE: PedidoStatus[] = ["MODELAGEM", "IMPRESSAO", "PINTURA", "ACABAMENTO", "FINALIZADO"];

const STATUS_LABELS: Record<PedidoStatus, string> = {
    MODELAGEM: "Modelagem",
    IMPRESSAO: "Impressão",
    PINTURA: "Pintura",
    ACABAMENTO: "Acabamento",
    FINALIZADO: "Finalizado",
};

function fimDoPrazo(prazo: string): number {
    const [y, m, d] = prazo.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

function formatDate(iso: string): string {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function tempoRelativo(iso?: string): string {
    if (!iso) return "";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "";
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const dia = new Date(dt); dia.setHours(0, 0, 0, 0);
    const dias = Math.round((hoje.getTime() - dia.getTime()) / 86_400_000);
    if (dias <= 0) return "hoje";
    if (dias === 1) return "ontem";
    if (dias < 7) return `há ${dias} dias`;
    if (dias < 14) return "há 1 semana";
    if (dias < 30) return `há ${Math.floor(dias / 7)} semanas`;
    if (dias < 60) return "há 1 mês";
    if (dias < 365) return `há ${Math.floor(dias / 30)} meses`;
    const anos = Math.floor(dias / 365);
    return anos === 1 ? "há 1 ano" : `há ${anos} anos`;
}

type Tom = "normal" | "urgente" | "atrasado";

function tempoRestante(prazo: string): { texto: string; tom: Tom } {
    const diff = fimDoPrazo(prazo) - Date.now();
    const MIN = 60_000, H = 3_600_000, D = 86_400_000;
    if (diff < 0) {
        const over = -diff;
        if (over >= D) {
            const n = Math.floor(over / D);
            return { texto: `Atrasado há ${n} ${n === 1 ? "dia" : "dias"}`, tom: "atrasado" };
        }
        const n = Math.max(1, Math.floor(over / H));
        return { texto: `Atrasado há ${n}h`, tom: "atrasado" };
    }
    if (diff >= D) {
        const n = Math.floor(diff / D);
        return { texto: `${n} dia${n === 1 ? "" : "s"} restante${n === 1 ? "" : "s"}`, tom: n <= 3 ? "urgente" : "normal" };
    }
    if (diff >= H) {
        const n = Math.floor(diff / H);
        return { texto: `${n}h ${n === 1 ? "restante" : "restantes"}`, tom: "urgente" };
    }
    const n = Math.max(1, Math.floor(diff / MIN));
    return { texto: `${n} min restantes`, tom: "urgente" };
}

function refCurta(id: string): string {
    return `#${id.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase()}`;
}

function ProgressStepper({ status }: { status: PedidoStatus }) {
    const currentIndex = STATUS_SEQUENCE.indexOf(status);
    const total = STATUS_SEQUENCE.length;
    const finalizado = status === "FINALIZADO";

    return (
        <div
            className={`stepper ${finalizado ? "completo" : ""}`}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label={`Etapa ${currentIndex + 1} de ${total}: ${STATUS_LABELS[status]}`}
        >
            {STATUS_SEQUENCE.map((s, i) => {
                const isDone = i < currentIndex || (finalizado && i === currentIndex);
                const isCurrent = i === currentIndex && !finalizado;
                const estado = isDone ? "done" : isCurrent ? "current" : "todo";
                return (
                    <div key={s} className={`step ${estado}`}>
                        {i > 0 && (
                            <span className={`step-line ${i <= currentIndex ? "filled" : ""}`}>
                                <span className="step-line-fill" />
                            </span>
                        )}
                        <span className="step-node">
                            <FiCheck className="step-check" size={13} />
                            <span className="step-dot" />
                        </span>
                        <span className="step-label">{STATUS_LABELS[s]}</span>
                    </div>
                );
            })}
        </div>
    );
}

interface PedidoRowProps {
    pedido: Pedido;
    onAvancar: (id: string) => void;
    onRegredir: (id: string) => void;
    onDeletar: (id: string) => void;
    onAbrir: (pedido: Pedido) => void;
    loading: boolean;
    index?: number;
    justAdvanced?: boolean;
}

function PedidoRow({ pedido, onAvancar, onRegredir, onDeletar, onAbrir, loading, index = 0, justAdvanced = false }: PedidoRowProps) {
    const finalizado = pedido.status === "FINALIZADO";
    const naPrimeiraEtapa = pedido.status === "MODELAGEM";
    const restante = finalizado ? null : tempoRestante(pedido.prazo);
    const tom: Tom = restante?.tom ?? "normal";

    const prazoClasse = tom === "atrasado" ? "prazo-atrasado" : tom === "urgente" ? "prazo-urgente" : "";
    const mostrarDot = tom === "atrasado" || tom === "urgente";

    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        function onClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
                setConfirmDel(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [menuOpen]);

    function fecharMenu() {
        setMenuOpen(false);
        setConfirmDel(false);
    }

    return (
        <div
            className={`pedido-row ${justAdvanced ? "is-advancing" : ""}`}
            style={{ "--row-index": index } as React.CSSProperties}
            role="button"
            tabIndex={0}
            onClick={() => onAbrir(pedido)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onAbrir(pedido);
                }
            }}
        >
            <div className="cell cell-ref">
                <span className="row-ref">{refCurta(pedido.id)}</span>
            </div>

            <div className="cell cell-cliente">
                <span className="row-avatar" aria-hidden="true">{pedido.cliente.charAt(0).toUpperCase()}</span>
                <span className="row-cliente-nome">{pedido.cliente}</span>
            </div>

            <div className="cell cell-projeto">
                <span className="row-projeto-nome">{pedido.projeto}</span>
                {pedido.descricao && <span className="row-projeto-desc">{pedido.descricao}</span>}
            </div>

            <div className="cell cell-prazo">
                <span className="cell-label">Prazo</span>
                {finalizado ? (
                    <>
                        <span className="row-prazo row-prazo-done">
                            <FiCheck size={14} />
                            Finalizado
                        </span>
                        <span className="row-prazo-sub">{tempoRelativo(pedido.atualizadoEm)}</span>
                    </>
                ) : (
                    <>
                        <span className={`row-prazo ${prazoClasse}`}>
                            {mostrarDot && <span className="urgente-dot" aria-hidden="true" />}
                            {formatDate(pedido.prazo)}
                        </span>
                        <span className={`row-prazo-sub ${tom === "atrasado" ? "sub-atrasado" : tom === "urgente" ? "sub-urgente" : ""}`}>
                            {restante!.texto}
                        </span>
                    </>
                )}
            </div>

            <div className="cell cell-progresso">
                <ProgressStepper status={pedido.status} />
            </div>

            <div className="cell cell-acoes">
                <div
                    className="kebab-wrap"
                    ref={menuRef}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className="kebab-btn"
                        aria-label="Mais ações"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((o) => !o)}
                    >
                        <FiMoreVertical size={18} />
                    </button>

                    {menuOpen && (
                        <div className="kebab-menu" role="menu">
                            {!confirmDel ? (
                                <>
                                    {!finalizado && (
                                        <button className="kebab-item" role="menuitem" disabled={loading} onClick={() => { onAvancar(pedido.id); fecharMenu(); }}>
                                            <FiArrowRight size={15} /> Avançar etapa
                                        </button>
                                    )}
                                    {!naPrimeiraEtapa && (
                                        <button className="kebab-item" role="menuitem" disabled={loading} onClick={() => { onRegredir(pedido.id); fecharMenu(); }}>
                                            <FiArrowLeft size={15} /> Regredir etapa
                                        </button>
                                    )}
                                    <button className="kebab-item kebab-danger" role="menuitem" onClick={() => setConfirmDel(true)}>
                                        <FiTrash2 size={15} /> Excluir
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="kebab-confirm-text">Excluir este pedido?</span>
                                    <div className="kebab-confirm-actions">
                                        <button className="kebab-confirm-cancel" onClick={() => setConfirmDel(false)}>Cancelar</button>
                                        <button className="kebab-confirm-del" onClick={() => { onDeletar(pedido.id); fecharMenu(); }}>Excluir</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PedidoRow;
