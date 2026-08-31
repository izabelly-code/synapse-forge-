/**
 * Leitura pontual da preferência do sistema por menos movimento. É uma função,
 * não um hook, porque as animações imperativas do app (FLIP das listas) precisam
 * consultar o valor no instante em que vão animar, e não a cada render.
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
