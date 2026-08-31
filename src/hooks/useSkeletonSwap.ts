import { useEffect, useRef, useState } from "react";

export interface UseSkeletonSwapOptions {
    /** `true` quando os dados já chegaram. */
    ready: boolean;
    /** Espera antes de mostrar o skeleton — respostas rápidas nem chegam a piscar. */
    delay?: number;
    /** Tempo mínimo que o skeleton fica na tela depois de aparecer. */
    minVisible?: number;
}

/**
 * Decide *quando* o skeleton aparece, não só *se*. Duas janelas resolvem os dois
 * incômodos clássicos do carregamento: o `delay` engole o flash de skeleton em
 * respostas de 80ms e o `minVisible` impede que ele suma no mesmo frame em que
 * apareceu (o "pisca" que faz a tela parecer quebrada).
 *
 * Mecânica portada do Skeleton Swap do interior.dev (https://www.interior.dev/docs/).
 */
export function useSkeletonSwap({
    ready,
    delay = 120,
    minVisible = 380,
}: UseSkeletonSwapOptions): { showSkeleton: boolean; busy: boolean } {
    const [visivel, setVisivel] = useState(false);
    const mostradoEm = useRef(0);

    useEffect(() => {
        if (!ready) {
            if (visivel) return;
            const t = setTimeout(() => {
                mostradoEm.current = performance.now();
                setVisivel(true);
            }, delay);
            return () => clearTimeout(t);
        }

        if (!visivel) return;
        const resto = Math.max(0, minVisible - (performance.now() - mostradoEm.current));
        const t = setTimeout(() => setVisivel(false), resto);
        return () => clearTimeout(t);
    }, [ready, visivel, delay, minVisible]);

    return { showSkeleton: visivel, busy: !ready };
}
