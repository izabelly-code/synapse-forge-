import { useEffect } from "react";

/**
 * Trava o scroll do `body` enquanto o componente estiver montado e restaura o valor
 * anterior ao desmontar. Usado pelos modais em tela cheia.
 */
export function useBodyScrollLock(): void {
    useEffect(() => {
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = overflowAnterior;
        };
    }, []);
}
