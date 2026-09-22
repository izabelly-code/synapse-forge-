import { useLayoutEffect, type RefObject } from "react";

/**
 * Mantém um popover ancorado dentro da viewport no eixo horizontal.
 *
 * Os popovers do app são `position: absolute` ancorados no gatilho (`right: 0`
 * na maioria), o que é certo no desktop e erra no layout empilhado: um kebab
 * alinhado à esquerda abre o menu ~122px fora da tela. Em vez de espalhar
 * exceções de CSS por tela, o hook mede o retângulo depois de montar e publica
 * o deslocamento necessário em `--menu-shift`; quem aplica é o CSS
 * (`transform: translateX(var(--menu-shift, 0px))` no `.kebab-menu` e no
 * `.filtro-dropdown`), então o posicionamento segue declarativo e o hook só
 * corrige o que não cabe.
 *
 * Roda uma vez por abertura (os menus desmontam ao fechar) e em `resize`.
 */
export function useMenuClamp(
    ref: RefObject<HTMLElement | null>,
    margem = 16,
): void {
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        function ajustar() {
            if (!el) return;
            // Zera antes de medir: a medida precisa ser da posição natural.
            el.style.setProperty("--menu-shift", "0px");
            const r = el.getBoundingClientRect();
            let deslocamento = 0;

            const sobraDireita = r.right - (window.innerWidth - margem);
            if (sobraDireita > 0) deslocamento = -sobraDireita;

            const sobraEsquerda = margem - (r.left + deslocamento);
            if (sobraEsquerda > 0) deslocamento += sobraEsquerda;

            if (deslocamento !== 0) {
                el.style.setProperty("--menu-shift", `${Math.round(deslocamento)}px`);
            }
        }

        ajustar();
        window.addEventListener("resize", ajustar);
        return () => window.removeEventListener("resize", ajustar);
    }, [ref, margem]);
}
