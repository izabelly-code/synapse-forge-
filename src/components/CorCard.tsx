import { useEffect, useRef, useState } from "react";
import { FiMoreVertical, FiEdit2, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { Cor, Acabamento } from "../types";

const ACABAMENTO_LABEL: Record<Acabamento, string> = {
    FOSCO: "Fosco",
    BRILHANTE: "Brilhante",
    METALICO: "Metálico",
    CETIM: "Cetim",
};

interface CorCardProps {
    cor: Cor;
    index: number;
    view: "grid" | "list";
    onEditar: (cor: Cor) => void;
    onDeletar: (id: string) => void;
}

function formatarReal(valor: number): string {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarMl(valor: number): string {
    return valor.toLocaleString("pt-BR");
}

function CorCard({ cor, index, view, onEditar, onDeletar }: CorCardProps) {
    const [menuAberto, setMenuAberto] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const baixo = cor.estoqueMl < cor.estoqueMinimoMl;

    useEffect(() => {
        if (!menuAberto) return;
        function onClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuAberto(false);
                setConfirmando(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [menuAberto]);

    const menu = (
        <div className="kebab-wrap" ref={menuRef}>
            <button
                type="button"
                className="kebab-btn"
                aria-label="Ações da cor"
                aria-haspopup="menu"
                aria-expanded={menuAberto}
                onClick={() => setMenuAberto((v) => !v)}
            >
                <FiMoreVertical size={18} />
            </button>
            {menuAberto && (
                <div className="kebab-menu" role="menu">
                    {confirmando ? (
                        <>
                            <p className="kebab-confirm-text">Excluir "{cor.nome}"?</p>
                            <div className="kebab-confirm-actions">
                                <button type="button" className="kebab-confirm-cancel" onClick={() => setConfirmando(false)}>
                                    Cancelar
                                </button>
                                <button type="button" className="kebab-confirm-del" onClick={() => onDeletar(cor.id)}>
                                    Excluir
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="kebab-item"
                                onClick={() => { setMenuAberto(false); onEditar(cor); }}
                            >
                                <FiEdit2 size={15} /> Editar
                            </button>
                            <button
                                type="button"
                                className="kebab-item kebab-danger"
                                onClick={() => setConfirmando(true)}
                            >
                                <FiTrash2 size={15} /> Excluir
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    if (view === "list") {
        return (
            <div className="cor-row" style={{ "--row-index": index } as React.CSSProperties}>
                <span className="cor-row-swatch" style={{ background: cor.hex }} aria-hidden="true" />
                <div className="cor-row-ident">
                    <span className="cor-nome">{cor.nome}</span>
                    <span className="cor-fornecedor">{cor.fornecedor}{cor.codigo ? ` · ${cor.codigo}` : ""}</span>
                </div>
                <span className="cor-chip-acabamento">{ACABAMENTO_LABEL[cor.acabamento]}</span>
                <div className="cor-row-metric">
                    <span className="cor-metric-label">Estoque</span>
                    <span className={`cor-metric-value ${baixo ? "is-baixo" : ""}`}>{formatarMl(cor.estoqueMl)} ml</span>
                </div>
                <div className="cor-row-metric">
                    <span className="cor-metric-label">Custo/ml</span>
                    <span className="cor-metric-value">R$ {formatarReal(cor.custoMl)}</span>
                </div>
                <div className="cor-row-acoes">
                    {baixo && (
                        <span className="cor-estoque-baixo" title="Estoque abaixo do mínimo">
                            <FiAlertCircle size={12} /> Estoque baixo
                        </span>
                    )}
                    {menu}
                </div>
            </div>
        );
    }

    return (
        <div className="cor-card" style={{ "--row-index": index } as React.CSSProperties}>
            <div className="cor-swatch" style={{ background: cor.hex }}>
                <span className="cor-swatch-acabamento">{ACABAMENTO_LABEL[cor.acabamento]}</span>
                <div className="cor-card-kebab">{menu}</div>
            </div>
            <div className="cor-card-body">
                <div className="cor-card-head">
                    <div className="cor-card-ident">
                        <span className="cor-nome">{cor.nome}</span>
                        <span className="cor-fornecedor">{cor.fornecedor}</span>
                    </div>
                    {baixo && (
                        <span className="cor-estoque-baixo" title="Estoque abaixo do mínimo">
                            <FiAlertCircle size={12} /> Estoque baixo
                        </span>
                    )}
                </div>
                <div className="cor-meta">
                    <div className="cor-meta-item">
                        <span className="cor-metric-label">Estoque</span>
                        <span className={`cor-metric-value ${baixo ? "is-baixo" : ""}`}>{formatarMl(cor.estoqueMl)} ml</span>
                    </div>
                    <div className="cor-meta-item cor-meta-custo">
                        <span className="cor-metric-label">Custo/ml</span>
                        <span className="cor-metric-value">R$ {formatarReal(cor.custoMl)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CorCard;
