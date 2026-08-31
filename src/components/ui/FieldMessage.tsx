import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface FieldMessageProps {
    /** Mensagem de erro. Enquanto for vazia, a dica fica visível. */
    error?: ReactNode;
    /** Dica neutra mostrada quando não há erro (força da senha, formato esperado...). */
    hint?: ReactNode;
    /** Id para ligar ao `aria-describedby` do campo. */
    id?: string;
    className?: string;
}

/**
 * Slot de mensagem de altura reservada, logo abaixo de um campo. Dica e erro
 * ocupam a *mesma* linha e alternam por opacidade, então o erro nunca empurra o
 * resto do formulário para baixo — a continuação natural da SYN-73, que já tinha
 * atrasado o *momento* do erro mas não o seu efeito no layout.
 *
 * Portado do Inline Validation do interior.dev (https://www.interior.dev/docs/).
 */
function FieldMessage({ error, hint, id, className }: FieldMessageProps) {
    const invalido = !!error;

    return (
        <span className={cn("field-message", className)} data-invalid={invalido ? "" : undefined}>
            <span className="field-message-layer field-message-hint" aria-hidden="true">{hint}</span>
            <span className="field-message-layer field-message-error" aria-hidden="true">{error}</span>

            <span id={id} className="sr-only" role="status" aria-live="polite">
                {error ?? ""}
            </span>
        </span>
    );
}

export default FieldMessage;
