import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface LinkButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    children: ReactNode;
}

/**
 * Botão com aparência de link (texto em cor de marca, sublinhado no hover).
 * Substitui os apelidos `.register-link`, `.login-link`, `.resend-link` e
 * `.forgot-password-link`, que apontavam todos para a mesma regra CSS.
 */
function LinkButton({ children, className, type = "button", ...rest }: LinkButtonProps) {
    return (
        <button type={type} className={cn("link", className)} {...rest}>
            {children}
        </button>
    );
}

export default LinkButton;
