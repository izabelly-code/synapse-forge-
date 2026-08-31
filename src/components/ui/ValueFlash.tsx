import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { useValueFlash } from "../../hooks/useValueFlash";

interface ValueFlashProps {
    value: number;
    /** Formatação do número. Padrão: `String(value)`. */
    format?: (value: number) => string;
    /**
     * `neutral` (padrão) só marca *que* mudou — é o certo quando subir não é
     * necessariamente bom (pedidos atrasados, por exemplo).
     * `direction` colore de verde/vermelho conforme subiu ou desceu.
     */
    tone?: "neutral" | "direction";
    /** Prefixo do anúncio em leitor de tela ("Total", "Estoque"...). */
    label?: string;
    className?: string;
}

/** Espera o número assentar antes de anunciar, para não tagarelar a cada tique. */
const ATRASO_ANUNCIO = 700;

/**
 * Destaca por um instante o número que acabou de mudar: o valor antigo sai na
 * direção da mudança, o novo entra pelo lado oposto e uma seta aponta o sentido.
 * Um contador que troca em silêncio, longe do clique que o causou, é uma
 * mudança que o usuário simplesmente não vê.
 *
 * Portado do Value Flash do interior.dev (https://www.interior.dev/docs/).
 */
function ValueFlash({ value, format, tone = "neutral", label, className }: ValueFlashProps) {
    const { direction, from, changeId, flashing } = useValueFlash(value);

    const texto = format ? format(value) : String(value);
    const textoAnterior = format ? format(from) : String(from);

    const [assentado, setAssentado] = useState(texto);
    useEffect(() => {
        const id = setTimeout(() => setAssentado(texto), ATRASO_ANUNCIO);
        return () => clearTimeout(id);
    }, [texto]);

    return (
        <span
            className={cn("value-flash", className)}
            data-flashing={flashing ? "" : undefined}
            data-direction={direction ?? undefined}
            data-tone={tone}
        >
            <span className="value-flash-tint" aria-hidden="true" />

            <span className="value-flash-digits" aria-hidden="true">
                {flashing && (
                    <span key={`${changeId}-out`} className="value-flash-out">{textoAnterior}</span>
                )}
                <span key={changeId} className="value-flash-in" data-animate={changeId > 0 ? "" : undefined}>
                    {texto}
                </span>
            </span>

            {/* Fora do fluxo: a seta aparece e some sem alargar o número. */}
            {flashing && direction && (
                <span key={`${changeId}-${direction}`} className="value-flash-arrow" aria-hidden="true">
                    <svg viewBox="0 0 256 256" fill="currentColor">
                        {direction === "up"
                            ? <path d="M128 68 L210 180 H46 Z" />
                            : <path d="M128 188 L46 76 H210 Z" />}
                    </svg>
                </span>
            )}

            <span className="sr-only" aria-live="polite">
                {label ? `${label}: ${assentado}` : assentado}
            </span>
        </span>
    );
}

export default ValueFlash;
