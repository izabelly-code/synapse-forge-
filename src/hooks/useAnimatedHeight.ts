import { useLayoutEffect, useRef } from "react";

/**
 * Faz um contêiner acompanhar a altura do conteúdo com transição, em vez de
 * pular quando o conteúdo troca (ex.: formulário → confirmação no modal).
 *
 * `outerRef` vai no invólucro (que recebe a altura em px e anima via CSS);
 * `innerRef` no conteúdo, observado por ResizeObserver. A primeira medida é
 * aplicada sem transição. `ativo` religa a observação quando o elemento monta
 * (útil em modais renderizados condicionalmente).
 */
export function useAnimatedHeight<O extends HTMLElement, I extends HTMLElement>(ativo: boolean) {
    const outerRef = useRef<O>(null);
    const innerRef = useRef<I>(null);

    useLayoutEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!ativo || !outer || !inner) return;

        let primeira = true;

        function aplicar() {
            if (!outer || !inner) return;
            const altura = `${inner.offsetHeight}px`;
            if (primeira) {
                primeira = false;
                outer.style.transition = "none";
                outer.style.height = altura;
                void outer.offsetHeight; // fixa o valor inicial antes de religar a transição
                outer.style.transition = "";
                return;
            }
            outer.style.height = altura;
        }

        aplicar();
        const observer = new ResizeObserver(aplicar);
        observer.observe(inner);

        return () => {
            observer.disconnect();
            outer.style.height = "";
        };
    }, [ativo]);

    return { outerRef, innerRef };
}
