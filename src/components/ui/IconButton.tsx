import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

/**
 * Variantes de botão-só-ícone que existem no produto. Cada uma aponta para a
 * classe canônica já usada pelo CSS — o componente unifica a marcação, não o visual.
 *
 * - `toolbar`     — pílula com borda nas barras de ação (sino de notificações).
 * - `kebab`       — botão de "mais ações" (⋮) em linhas e cards.
 * - `modal-close` — fechar modal, no canto do cabeçalho.
 * - `sidebar`     — controles do rodapé da Sidebar (tema e idioma).
 */
export type IconButtonVariant = "toolbar" | "kebab" | "modal-close" | "sidebar";

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
    toolbar: "icon-button",
    kebab: "kebab-btn",
    "modal-close": "modal-close",
    sidebar: "sidebar-icon-btn",
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    variant: IconButtonVariant;
    /** Ícone (e, quando houver, badge sobreposto). */
    children: ReactNode;
    /** Nome acessível do botão — obrigatório porque o conteúdo é só um ícone. */
    "aria-label": string;
}

function IconButton({ variant, children, className, type = "button", ...rest }: IconButtonProps) {
    return (
        <button type={type} className={cn(VARIANT_CLASS[variant], className)} {...rest}>
            {children}
        </button>
    );
}

export default IconButton;
