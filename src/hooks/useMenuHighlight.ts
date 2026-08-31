import { useEffect, useRef, type RefObject } from "react";

export interface UseMenuHighlightOptions {
    /** Enquanto for false nenhum listener é registrado — passe o estado de "aberto". */
    enabled: boolean;
    /** Quais filhos contam como item do menu. Padrão: botões filhos diretos. */
    itemSelector?: string;
}

/**
 * Faz o realce do item ativo *viajar* entre as opções em vez de aparecer e sumir
 * em cada uma. O hook só mede a linha sob o cursor (ou sob o foco) e publica
 * posição e altura em custom properties; quem desenha é o `.menu-highlight`, que
 * transita de uma para outra. Medir em vez de assumir altura fixa mantém o
 * mesmo hook válido para os kebabs, os filtros e o dropup de idioma.
 *
 * Uso: aplicar o ref no container do menu e renderizar
 * `<span className="menu-highlight" aria-hidden="true" />` como primeiro filho.
 *
 * Mecânica portada do Dropdown do interior.dev (https://www.interior.dev/docs/).
 */
export function useMenuHighlight<T extends HTMLElement>({
    enabled,
    itemSelector = ":scope > button:not(:disabled)",
}: UseMenuHighlightOptions): RefObject<T | null> {
    const ref = useRef<T>(null);

    useEffect(() => {
        const container = ref.current;
        if (!enabled || !container) return;

        function mover(alvo: EventTarget | null) {
            if (!container) return;
            const itens = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
            const item = itens.find((el) => el === alvo || el.contains(alvo as Node));
            // Sobre o respiro entre itens (ou sobre o passo de confirmação de um
            // kebab, que não tem itens) o realce se apaga em vez de ficar parado.
            if (!item) {
                container.removeAttribute("data-highlight");
                return;
            }
            container.style.setProperty("--menu-hl-y", `${item.offsetTop}px`);
            container.style.setProperty("--menu-hl-h", `${item.offsetHeight}px`);
            container.dataset.highlight = "on";
        }

        function onPointerMove(event: PointerEvent) {
            mover(event.target);
        }

        function onFocusIn(event: FocusEvent) {
            mover(event.target);
        }

        function onPointerLeave() {
            container?.removeAttribute("data-highlight");
        }

        // Só apaga quando o foco realmente sai do menu; entre um item e outro o
        // realce precisa continuar viajando.
        function onFocusOut(event: FocusEvent) {
            const proximo = event.relatedTarget as Node | null;
            if (proximo && container?.contains(proximo)) return;
            container?.removeAttribute("data-highlight");
        }

        container.addEventListener("pointermove", onPointerMove);
        container.addEventListener("focusin", onFocusIn);
        container.addEventListener("pointerleave", onPointerLeave);
        container.addEventListener("focusout", onFocusOut);

        return () => {
            container.removeEventListener("pointermove", onPointerMove);
            container.removeEventListener("focusin", onFocusIn);
            container.removeEventListener("pointerleave", onPointerLeave);
            container.removeEventListener("focusout", onFocusOut);
        };
    }, [enabled, itemSelector]);

    return ref;
}
