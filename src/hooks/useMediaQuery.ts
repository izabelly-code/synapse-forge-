import { useCallback, useSyncExternalStore } from "react";

/**
 * `true` enquanto a media query casa com o viewport. Espelha no React os
 * mesmos breakpoints do CSS (docs/design-tokens.md) para decisões que o CSS
 * não consegue tomar sozinho: trocar um componente por outro (abas ↔ dropdown,
 * botão da toolbar ↔ FAB) ou forçar um estado (grade no celular).
 *
 * useSyncExternalStore evita setState dentro de effect e já entrega o valor
 * certo na primeira render.
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const mql = window.matchMedia(query);
            mql.addEventListener("change", onChange);
            return () => mql.removeEventListener("change", onChange);
        },
        [query],
    );
    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
        () => false,
    );
}

/** Celular: abaixo do passo `md` (768px) do conjunto canônico. */
export const MOBILE_QUERY = "(max-width: 768px)";
