import { useRef, useState, type ReactNode } from "react";
import { Cancel01Icon, Notification03Icon } from "hugeicons-react";
import { cn } from "../../utils/cn";
import { useDismissable } from "../../hooks/useDismissable";
import IconButton from "./IconButton";

export interface NotificationItem {
    id: string;
    /** Linha principal do item (ex.: nome do projeto). */
    title: ReactNode;
    /** Linha secundária do item (ex.: cliente). */
    subtitle: ReactNode;
    /** Texto da etiqueta à direita (ex.: "Atrasado"). */
    tagLabel: string;
    /** `danger` = atrasado, `warn` = vence hoje, `info` = neutro (ex.: convite de equipe),
     *  `success` = concluído (ex.: pedido finalizado). */
    tone: "danger" | "warn" | "info" | "success";
    /** Data já formatada exibida abaixo do texto (ex.: "30/09, 14:20" ou "Prazo: 23/06"). */
    date?: string;
    /** Ação ao clicar no item; o painel fecha em seguida. */
    onSelect: () => void;
    /** Quando existe, o item ganha um X para dispensar o aviso sem abri-lo. */
    onDismiss?: () => void;
}

interface NotificationBellProps {
    items: NotificationItem[];
    /** Título do painel suspenso. */
    panelTitle: string;
    /** Texto exibido quando não há itens. */
    emptyText: string;
    /** Nome acessível do sino. */
    ariaLabel: string;
    /** Variante do botão do sino (padrão: toolbar). */
    variant?: "toolbar" | "sidebar";
    /** Direção de abertura do painel (padrão: down). */
    direction?: "down" | "up";
    /** Nome acessível do X de dispensar; recebe o título do item. */
    dismissLabel?: (title: string) => string;
}

/**
 * Sino de notificações com contador e painel suspenso, usado nas barras de ação
 * dos dashboards. Guarda o próprio estado de aberto/fechado e fecha ao clicar fora.
 */
function NotificationBell({ items, panelTitle, emptyText, ariaLabel, variant = "toolbar", direction = "down", dismissLabel }: NotificationBellProps) {
    const [aberto, setAberto] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useDismissable({
        enabled: aberto,
        refs: ref,
        onDismiss: () => setAberto(false),
    });

    return (
        <div className={cn("notif-wrap", direction === "up" && "notif-wrap--up")} ref={ref}>
            <IconButton
                variant={variant}
                onClick={() => setAberto((v) => !v)}
                aria-label={ariaLabel}
                aria-expanded={aberto}
            >
                <Notification03Icon size={18} />
                {items.length > 0 && <span className="notif-badge">{items.length}</span>}
            </IconButton>

            {aberto && (
                <div className="notif-panel" role="menu">
                    <div className="notif-panel-head">{panelTitle}</div>
                    {items.length === 0 ? (
                        <p className="notif-empty">{emptyText}</p>
                    ) : (
                        <ul className="notif-list">
                            {items.map((item) => (
                                <li key={item.id} className="notif-list-item">
                                    <button
                                        className="notif-item"
                                        onClick={() => { item.onSelect(); setAberto(false); }}
                                    >
                                        <span className="notif-item-projeto">{item.title}</span>
                                        <span className="notif-item-cliente">{item.subtitle}</span>
                                        {item.date && <span className="notif-item-data">{item.date}</span>}
                                        <span className={cn("notif-item-tag", `tag-${item.tone}`)}>
                                            {item.tagLabel}
                                        </span>
                                    </button>
                                    {/* Irmão do item, não filho: botão dentro de botão é HTML inválido.
                                        O painel continua aberto para dispensar vários em sequência. */}
                                    {item.onDismiss && (
                                        <button
                                            type="button"
                                            className="notif-item-fechar"
                                            onClick={item.onDismiss}
                                            aria-label={dismissLabel ? dismissLabel(typeof item.title === "string" ? item.title : "") : undefined}
                                            title={dismissLabel ? dismissLabel(typeof item.title === "string" ? item.title : "") : undefined}
                                        >
                                            <Cancel01Icon size={14} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
