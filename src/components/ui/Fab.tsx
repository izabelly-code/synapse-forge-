import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface FabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Rótulo acessível: o botão é só ícone. */
    label: string;
    children: ReactNode;
}

/**
 * Botão de ação flutuante (ilha redonda no canto inferior) para a ação primária
 * da página no celular, onde o botão da toolbar fica perdido no meio do
 * cabeçalho. Fixo na viewport; fica abaixo do scrim da gaveta e dos modais.
 */
function Fab({ label, children, className, type = "button", ...rest }: FabProps) {
    return (
        <button type={type} className={cn("fab", className)} aria-label={label} title={label} {...rest}>
            {children}
        </button>
    );
}

export default Fab;
