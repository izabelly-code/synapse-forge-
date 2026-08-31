import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface LoadingButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** True enquanto a ação está em andamento. */
    pending: boolean;
    /** Rótulo em repouso. */
    children: ReactNode;
    /** Rótulo durante a ação (acompanha o spinner). Padrão: o mesmo do repouso. */
    pendingLabel?: ReactNode;
}

/**
 * Botão de submit cujo rótulo vira spinner **sem mudar de largura**. As duas
 * faces ficam empilhadas na mesma célula de grid: a caixa é sempre a da face
 * mais larga, então trocar "Entrar" por "Entrando..." não faz o botão pular nem
 * empurrar o que está ao lado — o motivo pelo qual um botão de carregamento
 * costuma parecer instável.
 *
 * Portado do Loading Button do interior.dev (https://www.interior.dev/docs/).
 */
function LoadingButton({
    pending,
    children,
    pendingLabel,
    className,
    disabled,
    type = "submit",
    ...rest
}: LoadingButtonProps) {
    return (
        <button
            {...rest}
            type={type}
            className={cn("button", "loading-button", className)}
            disabled={disabled || pending}
            aria-busy={pending || undefined}
            data-pending={pending ? "" : undefined}
        >
            <span className="loading-button-faces" aria-hidden="true">
                <span className="loading-button-face" data-active={pending ? undefined : ""}>
                    {children}
                </span>
                <span className="loading-button-face" data-active={pending ? "" : undefined}>
                    <span className="loading-button-spinner" />
                    {pendingLabel ?? children}
                </span>
            </span>

            {/* O nome acessível continua estável; o estado vai pelo aria-busy. */}
            <span className="sr-only">{pending ? pendingLabel ?? children : children}</span>
        </button>
    );
}

export default LoadingButton;
