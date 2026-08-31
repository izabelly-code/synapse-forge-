import { useRef, useState } from "react";
import { AlertCircleIcon, Delete02Icon, MoreVerticalIcon, PencilEdit02Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { Cor } from "../../types";
import { cn } from "../../utils/cn";
import { formatCurrency, formatNumber } from "../../utils/format";
import { useDismissable } from "../../hooks/useDismissable";
import IconButton from "../ui/IconButton";
import MenuSurface from "../ui/MenuSurface";
import ValueFlash from "../ui/ValueFlash";

interface CorCardProps {
    cor: Cor;
    index: number;
    view: "grid" | "list";
    onEditar: (cor: Cor) => void;
    onDeletar: (id: string) => void;
}

function CorCard({ cor, index, view, onEditar, onDeletar }: CorCardProps) {
    const { t } = useTranslation();
    // Congelado na montagem: --row-index alimenta o animation-delay da animação
    // de entrada, e mudar um delay recoloca a animação (já terminada, com fill
    // forwards) na fase ativa — o card "sentava" de novo logo depois de o FLIP
    // deixá-lo no lugar novo. O escalonamento só faz sentido na entrada mesmo.
    const [indexEntrada] = useState(index);

    const [menuAberto, setMenuAberto] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const baixo = cor.estoqueMl < cor.estoqueMinimoMl;

    useDismissable({
        enabled: menuAberto,
        refs: menuRef,
        onDismiss: () => {
            setMenuAberto(false);
            setConfirmando(false);
        },
    });

    const menu = (
        <div className="kebab-wrap" ref={menuRef}>
            <IconButton
                variant="kebab"
                aria-label={t("cores.card.actionsAria")}
                aria-haspopup="menu"
                aria-expanded={menuAberto}
                onClick={() => setMenuAberto((v) => !v)}
            >
                <MoreVerticalIcon size={18} />
            </IconButton>
            {menuAberto && (
                <MenuSurface className="kebab-menu" role="menu">
                    {confirmando ? (
                        <>
                            <p className="kebab-confirm-text">{t("cores.card.confirmDelete", { name: cor.nome })}</p>
                            <div className="kebab-confirm-actions">
                                <button type="button" className="kebab-confirm-cancel" onClick={() => setConfirmando(false)}>
                                    {t("cores.card.cancel")}
                                </button>
                                <button type="button" className="kebab-confirm-del" onClick={() => onDeletar(cor.id)}>
                                    {t("cores.card.delete")}
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
                                <PencilEdit02Icon size={15} /> {t("cores.card.edit")}
                            </button>
                            <button
                                type="button"
                                className="kebab-item kebab-danger"
                                onClick={() => setConfirmando(true)}
                            >
                                <Delete02Icon size={15} /> {t("cores.card.delete")}
                            </button>
                        </>
                    )}
                </MenuSurface>
            )}
        </div>
    );

    if (view === "list") {
        return (
            <div className="cor-row" style={{ "--row-index": indexEntrada } as React.CSSProperties} data-flip-id={cor.id}>
                <span className="cor-row-swatch" style={{ background: cor.hex }} aria-hidden="true" />
                <div className="cor-row-ident">
                    <span className="cor-nome">{cor.nome}</span>
                    <span className="cor-fornecedor">{cor.fornecedor}{cor.codigo ? ` · ${cor.codigo}` : ""}</span>
                </div>
                <span className="cor-chip-acabamento">{t(`cores.acabamento.${cor.acabamento}`)}</span>
                <div className="cor-row-metric">
                    <span className="cor-metric-label">{t("cores.card.stockLabel")}</span>
                    <span className={cn("cor-metric-value", baixo && "is-baixo")}>
                        <ValueFlash value={cor.estoqueMl} format={formatNumber} tone="direction" label={t("cores.card.stockLabel")} /> ml
                    </span>
                </div>
                <div className="cor-row-metric">
                    <span className="cor-metric-label">{t("cores.card.costLabel")}</span>
                    <span className="cor-metric-value">{formatCurrency(cor.custoMl)}</span>
                </div>
                <div className="cor-row-acoes">
                    {baixo && (
                        <span className="cor-estoque-baixo" title={t("cores.card.lowStockTitle")}>
                            <AlertCircleIcon size={12} /> {t("cores.card.lowStock")}
                        </span>
                    )}
                    {menu}
                </div>
            </div>
        );
    }

    return (
        <div className="cor-card" style={{ "--row-index": indexEntrada } as React.CSSProperties} data-flip-id={cor.id}>
            <div className="cor-swatch" style={{ background: cor.hex }}>
                <span className="cor-swatch-acabamento">{t(`cores.acabamento.${cor.acabamento}`)}</span>
                <div className="cor-card-kebab">{menu}</div>
            </div>
            <div className="cor-card-body">
                <div className="cor-card-head">
                    <div className="cor-card-ident">
                        <span className="cor-nome">{cor.nome}</span>
                        <span className="cor-fornecedor">{cor.fornecedor}</span>
                    </div>
                    {baixo && (
                        <span className="cor-estoque-baixo" title={t("cores.card.lowStockTitle")}>
                            <AlertCircleIcon size={12} /> {t("cores.card.lowStock")}
                        </span>
                    )}
                </div>
                <div className="cor-meta">
                    <div className="cor-meta-item">
                        <span className="cor-metric-label">{t("cores.card.stockLabel")}</span>
                        <span className={cn("cor-metric-value", baixo && "is-baixo")}>
                            <ValueFlash value={cor.estoqueMl} format={formatNumber} tone="direction" label={t("cores.card.stockLabel")} /> ml
                        </span>
                    </div>
                    <div className="cor-meta-item cor-meta-custo">
                        <span className="cor-metric-label">{t("cores.card.costLabel")}</span>
                        <span className="cor-metric-value">{formatCurrency(cor.custoMl)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CorCard;
