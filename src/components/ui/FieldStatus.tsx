export type FieldState = "idle" | "valid" | "invalid";

interface FieldStatusProps {
    state: FieldState;
}

/**
 * Marca de validação dentro do campo, à direita: um tique quando o valor já
 * serve e um alerta quando não serve. É o "reward early, punish late" ficando
 * visível — a confirmação aparece enquanto a pessoa digita, sem esperar o
 * submit, e o erro só quando ela sai do campo.
 *
 * Precisa de um ancestral posicionado (`.input-wrapper`).
 *
 * Portado do Inline Validation do interior.dev (https://www.interior.dev/docs/).
 */
function FieldStatus({ state }: FieldStatusProps) {
    return (
        <span className="field-status" data-state={state} aria-hidden="true">
            <svg className="field-status-icon field-status-ok" viewBox="0 0 12 12" fill="none">
                <path
                    d="M2 6.3 4.7 9 10 3.2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <svg className="field-status-icon field-status-erro" viewBox="0 0 12 12" fill="none">
                <path d="M6 2v4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <rect x="5.15" y="8.4" width="1.7" height="1.7" rx="0.5" fill="currentColor" />
            </svg>
        </span>
    );
}

export default FieldStatus;
