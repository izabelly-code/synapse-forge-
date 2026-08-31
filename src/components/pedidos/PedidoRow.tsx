import { useRef, useState } from 'react';
import { ArrowLeft02Icon, ArrowRight02Icon, Delete02Icon, MoreVerticalIcon, PencilEdit02Icon, Tick02Icon } from "hugeicons-react";
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Pedido, PedidoStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';
import { useDismissable } from '../../hooks/useDismissable';
import IconButton from '../ui/IconButton';
import MenuSurface from '../ui/MenuSurface';
import { avatarPalette } from "../../utils/avatarPalette";

const STATUS_SEQUENCE: PedidoStatus[] = ["MODELAGEM", "IMPRESSAO", "PINTURA", "ACABAMENTO", "FINALIZADO"];

function fimDoPrazo(prazo: string): number {
    const [y, m, d] = prazo.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

function dataLocal(iso: string): Date {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
}

function tempoRelativo(iso: string | undefined, t: TFunction): string {
    if (!iso) return "";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "";
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const dia = new Date(dt); dia.setHours(0, 0, 0, 0);
    const dias = Math.round((hoje.getTime() - dia.getTime()) / 86_400_000);
    if (dias <= 0) return t("pedidos.row.relToday");
    if (dias === 1) return t("pedidos.row.relYesterday");
    if (dias < 7) return t("pedidos.row.relDays", { count: dias });
    if (dias < 30) return t("pedidos.row.relWeeks", { count: Math.floor(dias / 7) });
    if (dias < 365) return t("pedidos.row.relMonths", { count: Math.floor(dias / 30) });
    return t("pedidos.row.relYears", { count: Math.floor(dias / 365) });
}

type Tom = "normal" | "urgente" | "atrasado";

function tempoRestante(prazo: string, t: TFunction): { texto: string; tom: Tom } {
    const diff = fimDoPrazo(prazo) - Date.now();
    const MIN = 60_000, H = 3_600_000, D = 86_400_000;
    if (diff < 0) {
        const over = -diff;
        if (over >= D) {
            return { texto: t("pedidos.row.lateDays", { count: Math.floor(over / D) }), tom: "atrasado" };
        }
        return { texto: t("pedidos.row.lateHours", { count: Math.max(1, Math.floor(over / H)) }), tom: "atrasado" };
    }
    if (diff >= D) {
        const n = Math.floor(diff / D);
        return { texto: t("pedidos.row.daysLeft", { count: n }), tom: n <= 3 ? "urgente" : "normal" };
    }
    if (diff >= H) {
        return { texto: t("pedidos.row.hoursLeft", { count: Math.floor(diff / H) }), tom: "urgente" };
    }
    return { texto: t("pedidos.row.minutesLeft", { count: Math.max(1, Math.floor(diff / MIN)) }), tom: "urgente" };
}

function refCurta(id: string): string {
    return `#${id.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase()}`;
}

function ProgressStepper({ status }: { status: PedidoStatus }) {
    const { t } = useTranslation();
    const currentIndex = STATUS_SEQUENCE.indexOf(status);
    const total = STATUS_SEQUENCE.length;
    const finalizado = status === "FINALIZADO";

    return (
        <div
            className={cn("stepper", finalizado && "completo")}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label={t("pedidos.row.stepperAria", { current: currentIndex + 1, total, status: t(`pedidos.status.${status}`) })}
        >
            {STATUS_SEQUENCE.map((s, i) => {
                const isDone = i < currentIndex || (finalizado && i === currentIndex);
                const isCurrent = i === currentIndex && !finalizado;
                const estado = isDone ? "done" : isCurrent ? "current" : "todo";
                return (
                    <div key={s} className={cn("step", estado)}>
                        {i > 0 && (
                            <span className={cn("step-line", i <= currentIndex && "filled")}>
                                <span className="step-line-fill" />
                            </span>
                        )}
                        <span className="step-node">
                            <Tick02Icon className="step-check" size={13} />
                            <span className="step-dot" />
                        </span>
                        <span className="step-label">{t(`pedidos.status.${s}`)}</span>
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
    onEditar: (pedido: Pedido) => void;
    loading: boolean;
    index?: number;
    justAdvanced?: boolean;
}

function PedidoRow({ pedido, onAvancar, onRegredir, onDeletar, onAbrir, onEditar, loading, index = 0, justAdvanced = false }: PedidoRowProps) {
    const { t } = useTranslation();
    const finalizado = pedido.status === "FINALIZADO";
    const naPrimeiraEtapa = pedido.status === "MODELAGEM";
    const restante = finalizado ? null : tempoRestante(pedido.prazo, t);
    const tom: Tom = restante?.tom ?? "normal";

    const prazoClasse = tom === "atrasado" ? "prazo-atrasado" : tom === "urgente" ? "prazo-urgente" : "";
    const mostrarDot = tom === "atrasado" || tom === "urgente";

    // Congelado na montagem: --row-index alimenta o animation-delay da animação
    // de entrada, e mudar um delay recoloca a animação (já terminada, com fill
    // forwards) na fase ativa — a linha "sentava" de novo logo depois de o FLIP
    // deixá-la no lugar novo. O escalonamento só faz sentido na entrada mesmo.
    const [indexEntrada] = useState(index);

    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    function fecharMenu() {
        setMenuOpen(false);
        setConfirmDel(false);
    }

    useDismissable({
        enabled: menuOpen,
        refs: menuRef,
        onDismiss: fecharMenu,
    });

    return (
        <div
            className={cn("pedido-row", justAdvanced && "is-advancing")}
            style={{ "--row-index": indexEntrada } as React.CSSProperties}
            data-flip-id={pedido.id}
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
                <span className={cn("row-avatar", avatarPalette(pedido.cliente))} aria-hidden="true">{pedido.cliente.charAt(0).toUpperCase()}</span>
                <span className="row-cliente-nome">{pedido.cliente}</span>
            </div>

            <div className="cell cell-projeto">
                <span className="row-projeto-nome">{pedido.projeto}</span>
                {pedido.descricao && <span className="row-projeto-desc">{pedido.descricao}</span>}
            </div>

            <div className="cell cell-prazo">
                <span className="cell-label">{t("pedidos.row.deadlineLabel")}</span>
                {finalizado ? (
                    <>
                        <span className="row-prazo row-prazo-done">
                            <Tick02Icon size={14} />
                            {t("pedidos.status.FINALIZADO")}
                        </span>
                        <span className="row-prazo-sub">{tempoRelativo(pedido.atualizadoEm, t)}</span>
                    </>
                ) : (
                    <>
                        <span className={cn("row-prazo", prazoClasse)}>
                            {mostrarDot && <span className="urgente-dot" aria-hidden="true" />}
                            {formatDate(dataLocal(pedido.prazo), { day: "2-digit", month: "short" })}
                        </span>
                        <span className={cn("row-prazo-sub", tom === "atrasado" && "sub-atrasado", tom === "urgente" && "sub-urgente")}>
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
                    <IconButton
                        variant="kebab"
                        aria-label={t("pedidos.row.moreActions")}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((o) => !o)}
                    >
                        <MoreVerticalIcon size={18} />
                    </IconButton>

                    {menuOpen && (
                        <MenuSurface className="kebab-menu" role="menu">
                            {!confirmDel ? (
                                <>
                                    {!finalizado && (
                                        <button className="kebab-item" role="menuitem" disabled={loading} onClick={() => { onAvancar(pedido.id); fecharMenu(); }}>
                                            <ArrowRight02Icon size={15} /> {t("pedidos.row.advanceStage")}
                                        </button>
                                    )}
                                    {!naPrimeiraEtapa && (
                                        <button className="kebab-item" role="menuitem" disabled={loading} onClick={() => { onRegredir(pedido.id); fecharMenu(); }}>
                                            <ArrowLeft02Icon size={15} /> {t("pedidos.row.regressStage")}
                                        </button>
                                    )}
                                    <button className="kebab-item" role="menuitem" onClick={() => { onEditar(pedido); fecharMenu(); }}>
                                        <PencilEdit02Icon size={15} /> {t("pedidos.row.editOrder")}
                                    </button>
                                    <button className="kebab-item kebab-danger" role="menuitem" onClick={() => setConfirmDel(true)}>
                                        <Delete02Icon size={15} /> {t("pedidos.row.delete")}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="kebab-confirm-text">{t("pedidos.row.confirmDelete")}</span>
                                    <div className="kebab-confirm-actions">
                                        <button className="kebab-confirm-cancel" onClick={() => setConfirmDel(false)}>{t("pedidos.row.cancel")}</button>
                                        <button className="kebab-confirm-del" onClick={() => { onDeletar(pedido.id); fecharMenu(); }}>{t("pedidos.row.delete")}</button>
                                    </div>
                                </>
                            )}
                        </MenuSurface>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PedidoRow;
