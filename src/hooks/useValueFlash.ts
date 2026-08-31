import { useEffect, useRef, useState } from "react";

export type FlashDirection = "up" | "down";

export interface ValueFlashState {
    /** Direção da última mudança, ou null enquanto o valor nunca mudou. */
    direction: FlashDirection | null;
    /** Valor de onde veio — usado para animar o número antigo saindo. */
    from: number;
    /** Incrementa a cada mudança; serve de `key` para remontar as animações. */
    changeId: number;
    /** True durante a janela de destaque. */
    flashing: boolean;
}

/**
 * Detecta que um número mudou e por quanto tempo ele deve ficar destacado.
 * Um valor que se atualiza sozinho (um contador que reage a outra ação na tela)
 * passa despercebido se apenas trocar; a janela de `hold` dá ao olho a chance
 * de voltar e ver *qual* número mudou.
 *
 * Mecânica portada do Value Flash do interior.dev (https://www.interior.dev/docs/).
 */
export function useValueFlash(value: number, hold = 900): ValueFlashState {
    const [state, setState] = useState<ValueFlashState>({
        direction: null,
        from: value,
        changeId: 0,
        flashing: false,
    });

    const anterior = useRef(value);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const antes = anterior.current;
        if (Object.is(antes, value)) return;
        anterior.current = value;

        const delta = value - antes;
        if (delta === 0) return;

        setState((prev) => ({
            direction: delta > 0 ? "up" : "down",
            from: antes,
            changeId: prev.changeId + 1,
            flashing: true,
        }));

        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            timer.current = null;
            setState((prev) => (prev.flashing ? { ...prev, flashing: false } : prev));
        }, hold);
    }, [value, hold]);

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    return state;
}
