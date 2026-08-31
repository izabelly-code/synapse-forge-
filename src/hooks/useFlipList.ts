import { useLayoutEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "../utils/motion";

/** Fora da escala de --duration-*: é o tempo do trajeto de uma linha, não de um hover. */
const DURACAO = 320;
const ATRASO_POR_ITEM = 18;
const ATRASO_MAXIMO = 8;
/** Deslocamentos menores que isso são ruído de sub-pixel, não uma mudança de ordem. */
const LIMIAR_PX = 1;

/**
 * Anima a *mudança de posição* dos itens de uma lista (técnica FLIP: mede antes,
 * mede depois, aplica o delta invertido e solta). Sem isso, reordenar ou filtrar
 * troca o conteúdo no mesmo frame e o olho perde o rastro de onde cada linha foi
 * parar; com isso as linhas viajam para o novo lugar e a lista continua sendo a
 * mesma lista.
 *
 * Cada filho animável precisa de um `data-flip-id` estável.
 *
 * Mecânica portada do Sortable Table / Filter Grid do interior.dev
 * (https://www.interior.dev/docs/).
 *
 * @param containerRef elemento que envolve os itens.
 * @param ordem string que muda quando a ordem/filtro muda (ex.: os ids concatenados).
 */
export function useFlipList(containerRef: RefObject<HTMLElement | null>, ordem: string): void {
    const anteriores = useRef(new Map<string, DOMRect>());
    const ultimoContainer = useRef<HTMLElement | null>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) {
            anteriores.current.clear();
            ultimoContainer.current = null;
            return;
        }

        // Container novo (troca de lista para grade, saída do estado vazio): as
        // medidas antigas são de outro layout e animar a partir delas mandaria os
        // itens voando de lugar nenhum.
        if (ultimoContainer.current !== container) {
            anteriores.current.clear();
            ultimoContainer.current = container;
        }

        const nos = Array.from(container.querySelectorAll<HTMLElement>("[data-flip-id]"));
        const atuais = new Map<string, DOMRect>();
        for (const no of nos) {
            const id = no.dataset.flipId;
            if (id) atuais.set(id, no.getBoundingClientRect());
        }

        // Primeira medição (montagem) não anima: não há "de onde" vir. A entrada
        // dos itens novos continua a cargo da animação CSS de cada linha/card.
        if (anteriores.current.size > 0 && !prefersReducedMotion()) {
            let animados = 0;
            for (const no of nos) {
                const id = no.dataset.flipId;
                if (!id) continue;

                const antes = anteriores.current.get(id);
                const depois = atuais.get(id);
                if (!antes || !depois) continue;

                const dx = antes.left - depois.left;
                const dy = antes.top - depois.top;
                if (Math.abs(dx) < LIMIAR_PX && Math.abs(dy) < LIMIAR_PX) continue;

                no.animate(
                    [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
                    {
                        duration: DURACAO,
                        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                        delay: Math.min(animados, ATRASO_MAXIMO) * ATRASO_POR_ITEM,
                        composite: "replace",
                    },
                );
                animados++;
            }
        }

        anteriores.current = atuais;
    }, [containerRef, ordem]);
}
