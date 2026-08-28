import { useRef, useState, type ReactNode } from "react";
import { Notification03Icon } from "hugeicons-react";
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
    /** `danger` = atrasado, `warn` = vence hoje. */
    tone: "danger" | "warn";
    /** Ação ao clicar no item; o painel fecha em seguida. */
    onSelect: () => void;
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
}

/**
 * Sino de notificações com contador e painel suspenso, usado nas barras de ação
 * dos dashboards. Guarda o próprio estado de aberto/fechado e fecha ao clicar fora.
 */
function NotificationBell({ items, panelTitle, emptyText, ariaLabel, variant = "toolbar", direction = "down" }: NotificationBellProps) {
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
                                <li key={item.id}>
                                    <button
                                        className="notif-item"
                                        onClick={() => { item.onSelect(); setAberto(false); }}
                                    >
                                        <span className="notif-item-projeto">{item.title}</span>
                                        <span className="notif-item-cliente">{item.subtitle}</span>
                                        <span className={cn("notif-item-tag", `tag-${item.tone}`)}>
                                            {item.tagLabel}
                                        </span>
                                    </button>
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
