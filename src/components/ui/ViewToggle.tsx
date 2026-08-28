import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface ViewToggleOption<T extends string> {
    value: T;
    /** Ícone do modo — o rótulo textual fica só no `aria-label`. */
    icon: ReactNode;
    /** Nome acessível do botão (ex.: "Visualizar em grade"). */
    label: string;
}

interface ViewToggleProps<T extends string> {
    value: T;
    options: ViewToggleOption<T>[];
    onChange: (value: T) => void;
    /** Nome acessível do grupo (ex.: "Modo de visualização"). */
    ariaLabel: string;
    className?: string;
}

/** Grupo de botões-ícone que alterna o modo de visualização de uma listagem (grade/lista). */
function ViewToggle<T extends string>({ value, options, onChange, ariaLabel, className }: ViewToggleProps<T>) {
    return (
        <div className={cn("view-toggle", className)} role="group" aria-label={ariaLabel}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={cn("view-btn", value === option.value && "is-active")}
                    onClick={() => onChange(option.value)}
                    aria-pressed={value === option.value}
                    aria-label={option.label}
                >
                    {option.icon}
                </button>
            ))}
        </div>
    );
}

export default ViewToggle;
