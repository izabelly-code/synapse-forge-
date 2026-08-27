import { useEffect, useRef } from "react";

export interface UseEscapeKeyOptions {
    /** Registra o listener na fase de captura (útil para sobrepor um modal já aberto). Padrão: false. */
    capture?: boolean;
}

/**
 * Chama `onEscape` enquanto o componente estiver montado e a tecla Escape for pressionada.
 * O callback é sempre lido da última renderização, então o listener não precisa ser recriado.
 */
export function useEscapeKey(
    onEscape: (event: KeyboardEvent) => void,
    { capture = false }: UseEscapeKeyOptions = {},
): void {
    const onEscapeRef = useRef(onEscape);

    useEffect(() => {
        onEscapeRef.current = onEscape;
    });

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onEscapeRef.current(event);
        }

        document.addEventListener("keydown", onKeyDown, capture);
        return () => document.removeEventListener("keydown", onKeyDown, capture);
    }, [capture]);
}
