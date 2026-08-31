import { useEffect, useState, type RefObject } from "react";

const FOCUSABLE = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "iframe",
    "summary",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

function focaveisDentro(raiz: HTMLElement): HTMLElement[] {
    return Array.from(raiz.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) =>
            el.tabIndex !== -1 &&
            !el.hasAttribute("inert") &&
            el.getAttribute("aria-hidden") !== "true" &&
            el.getClientRects().length > 0,
    );
}

/**
 * Prende o foco dentro do painel do modal enquanto ele estiver aberto e devolve
 * o foco ao elemento que o abriu quando fechar. Complementa `useBodyScrollLock`
 * e `useEscapeKey` (SYN-72): sem isso o Tab passeia pelo dashboard atrás do
 * scrim, que é o ponto de acessibilidade que uma banca costuma cobrar.
 *
 * Mecânica portada do Modal do interior.dev (https://www.interior.dev/docs/).
 *
 * @param painelRef container do diálogo (recebe `tabindex="-1"` automaticamente).
 * @param ativo enquanto `false` nenhum listener é registrado.
 */
export function useFocusTrap(painelRef: RefObject<HTMLElement | null>, ativo = true): void {
    // Lido na primeira renderização, e não dentro do efeito: um `autoFocus` no
    // primeiro campo do modal move o foco para dentro do painel ainda no commit,
    // antes de qualquer efeito rodar — quem abriu o modal já teria se perdido.
    const [gatilho] = useState<HTMLElement | null>(() =>
        document.activeElement instanceof HTMLElement && document.activeElement !== document.body
            ? document.activeElement
            : null,
    );

    useEffect(() => {
        const painel = painelRef.current;
        if (!ativo || !painel) return;

        if (!painel.hasAttribute("tabindex")) painel.setAttribute("tabindex", "-1");

        // O autoFocus de um campo interno roda antes deste efeito; só assumimos o
        // foco quando ninguém dentro do painel o pegou.
        if (!painel.contains(document.activeElement)) {
            (focaveisDentro(painel)[0] ?? painel).focus({ preventScroll: true });
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== "Tab" || !painel) return;

            const itens = focaveisDentro(painel);
            if (itens.length === 0) {
                event.preventDefault();
                painel.focus({ preventScroll: true });
                return;
            }

            const primeiro = itens[0];
            const ultimo = itens[itens.length - 1];
            const atual = document.activeElement;

            if (event.shiftKey && (atual === primeiro || atual === painel)) {
                event.preventDefault();
                ultimo.focus({ preventScroll: true });
            } else if (!event.shiftKey && atual === ultimo) {
                event.preventDefault();
                primeiro.focus({ preventScroll: true });
            }
        }

        // Rede de segurança para foco que entra por fora do Tab (clique, atalho do
        // navegador): puxa de volta para o painel.
        function onFocusIn(event: FocusEvent) {
            const alvo = event.target as HTMLElement | null;
            if (!painel || !alvo || painel.contains(alvo)) return;
            // Um diálogo aberto por cima deste (o lightbox de imagem) tem prioridade;
            // roubar o foco dele deixaria o botão de fechar inalcançável.
            if (alvo.closest?.('[role="dialog"]')) return;
            painel.focus({ preventScroll: true });
        }

        painel.addEventListener("keydown", onKeyDown);
        document.addEventListener("focusin", onFocusIn);

        return () => {
            painel.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("focusin", onFocusIn);
            if (gatilho && gatilho.isConnected) gatilho.focus({ preventScroll: true });
        };
    }, [painelRef, ativo, gatilho]);
}
