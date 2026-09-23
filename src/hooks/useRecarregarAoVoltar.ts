import { useEffect, useRef } from "react";

/** Intervalo mínimo entre recargas: foco e visibilidade costumam disparar juntos. */
const INTERVALO_MINIMO_MS = 10_000;

/**
 * Chama `recarregar` quando a pessoa volta para a aba ou para a janela, em vez de
 * um botão "Atualizar". Cobre o caso real: mandar um convite, sair, e ao voltar o
 * integrante novo já estar lá. `ativo = false` pausa (ex.: com um modal aberto,
 * para não trocar os dados por baixo de quem está editando).
 */
export function useRecarregarAoVoltar(recarregar: () => void, ativo = true) {
    const recarregarRef = useRef(recarregar);
    const ultimaRef = useRef(0);

    useEffect(() => {
        recarregarRef.current = recarregar;
    });

    useEffect(() => {
        if (!ativo) return;

        function aoVoltar() {
            if (document.visibilityState !== "visible") return;
            const agora = Date.now();
            if (agora - ultimaRef.current < INTERVALO_MINIMO_MS) return;
            ultimaRef.current = agora;
            recarregarRef.current();
        }

        document.addEventListener("visibilitychange", aoVoltar);
        window.addEventListener("focus", aoVoltar);
        return () => {
            document.removeEventListener("visibilitychange", aoVoltar);
            window.removeEventListener("focus", aoVoltar);
        };
    }, [ativo]);
}
