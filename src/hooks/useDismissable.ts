import { useEffect, useRef, type RefObject } from "react";

type ContainerRef = RefObject<HTMLElement | null>;

export interface UseDismissableOptions {
    /** Enquanto for false nenhum listener é registrado — passe aqui o estado de "aberto". */
    enabled: boolean;
    /** Container(es) considerados "dentro": um mousedown fora de todos eles dispara `onDismiss`. */
    refs: ContainerRef | ContainerRef[];
    /** Fecha o menu/dropdown. */
    onDismiss: () => void;
    /** Também fecha ao pressionar Escape. Padrão: false. */
    closeOnEscape?: boolean;
}

/**
 * Fecha um dropdown/menu quando o usuário pressiona o mouse fora do container e,
 * opcionalmente, quando pressiona Escape. Substitui o par useEffect + addEventListener
 * que estava repetido em cada componente com menu suspenso.
 */
export function useDismissable({
    enabled,
    refs,
    onDismiss,
    closeOnEscape = false,
}: UseDismissableOptions): void {
    const latest = useRef({ refs, onDismiss });

    useEffect(() => {
        latest.current = { refs, onDismiss };
    });

    useEffect(() => {
        if (!enabled) return;

        function contemAlvo(alvo: Node) {
            const lista = Array.isArray(latest.current.refs) ? latest.current.refs : [latest.current.refs];
            return lista.some((ref) => ref.current?.contains(alvo) ?? false);
        }

        function onMouseDown(event: MouseEvent) {
            if (!contemAlvo(event.target as Node)) latest.current.onDismiss();
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") latest.current.onDismiss();
        }

        document.addEventListener("mousedown", onMouseDown);
        if (closeOnEscape) document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            if (closeOnEscape) document.removeEventListener("keydown", onKeyDown);
        };
    }, [enabled, closeOnEscape]);
}
