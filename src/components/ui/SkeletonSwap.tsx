import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { useSkeletonSwap } from "../../hooks/useSkeletonSwap";

interface SkeletonSwapProps {
    /** `true` quando os dados chegaram. */
    ready: boolean;
    /** Placeholder mostrado enquanto carrega (os skeletons já existentes de cada tela). */
    skeleton: ReactNode;
    /** Conteúdo real. */
    children: ReactNode;
    /** Rótulo para leitores de tela ("Pedidos", "Materiais"...). */
    label?: string;
    className?: string;
}

/**
 * Troca skeleton por conteúdo com crossfade, no mesmo espaço da tela. As duas
 * camadas ocupam a mesma célula de grid, então a caixa não colapsa entre uma e
 * outra — a lista aparece *no lugar* do placeholder em vez de surgir seca depois
 * que ele some.
 *
 * Portado do Skeleton Swap do interior.dev (https://www.interior.dev/docs/).
 */
function SkeletonSwap({ ready, skeleton, children, label, className }: SkeletonSwapProps) {
    const { showSkeleton } = useSkeletonSwap({ ready });

    return (
        <div
            className={cn("skeleton-swap", className)}
            aria-busy={!ready}
            aria-label={label}
            data-loading={showSkeleton ? "" : undefined}
        >
            <div className="skeleton-swap-content" data-hidden={showSkeleton ? "" : undefined}>
                {children}
            </div>

            {showSkeleton && (
                <div className="skeleton-swap-placeholder" aria-hidden="true">
                    {skeleton}
                </div>
            )}
        </div>
    );
}

export default SkeletonSwap;
