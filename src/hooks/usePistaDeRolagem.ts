import { useEffect, type RefObject } from "react";

/**
 * Marca num contêiner rolável se há conteúdo escondido acima ou abaixo, com os
 * atributos `data-mais-acima` e `data-mais-abaixo`; o CSS desenha o fade na
 * borda correspondente. Serve onde a barra de rolagem é overlay (iPad, macOS) e
 * some: sem a pista, o usuário não sabe que a lista continua.
 *
 * Escreve direto no DOM, sem estado React, para não re-renderizar a cada
 * rolagem. Quando tudo cabe, nenhum atributo fica no elemento.
 */
export function usePistaDeRolagem(ref: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        function atualizar() {
            if (!el) return;
            // 1px de folga: o scrollTop pode ficar fracionário no zoom do navegador
            el.toggleAttribute("data-mais-acima", el.scrollTop > 1);
            el.toggleAttribute("data-mais-abaixo", el.scrollTop + el.clientHeight < el.scrollHeight - 1);
        }

        // A altura do conteúdo muda sem o contêiner mudar (itens filtrados pelo
        // papel que chega depois, troca de idioma, fonte carregando): observa os
        // filhos também e volta a observar quando eles trocam.
        const redimensionar = new ResizeObserver(atualizar);
        function observarFilhos() {
            if (!el) return;
            redimensionar.disconnect();
            redimensionar.observe(el);
            for (const filho of el.children) redimensionar.observe(filho);
            atualizar();
        }
        const mutacoes = new MutationObserver(observarFilhos);

        observarFilhos();
        mutacoes.observe(el, { childList: true });
        el.addEventListener("scroll", atualizar, { passive: true });

        return () => {
            el.removeEventListener("scroll", atualizar);
            mutacoes.disconnect();
            redimensionar.disconnect();
        };
    }, [ref]);
}
