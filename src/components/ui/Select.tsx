import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown01Icon, Tick02Icon } from "hugeicons-react";
import { cn } from "../../utils/cn";

export interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    id?: string;
    placeholder?: string;
    variant?: "form" | "filter";
    label?: string;
    icon?: ReactNode;
    ariaLabel?: string;
}

function Select({
    value,
    options,
    onChange,
    id,
    placeholder = "Selecione",
    variant = "form",
    label,
    icon,
    ariaLabel,
}: SelectProps) {
    const [aberto, setAberto] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selecionada = options.find((o) => o.value === value);
    const filtroAtivo = variant === "filter" && value !== (options[0]?.value ?? "");

    useEffect(() => {
        if (!aberto) return;
        function onClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setAberto(false);
        }
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [aberto]);

    const textoSelecionado = selecionada?.label ?? placeholder;

    return (
        <div className={cn("ui-select", `ui-select-${variant}`)} ref={ref}>
            <button
                type="button"
                id={id}
                className={
                    variant === "filter"
                        ? cn("filtro-action", filtroAtivo && "is-active")
                        : cn("ui-select-trigger", !selecionada && "is-placeholder")
                }
                aria-haspopup="listbox"
                aria-expanded={aberto}
                aria-label={ariaLabel}
                onClick={() => setAberto((v) => !v)}
            >
                {icon}
                {variant === "filter" && label ? (
                    <span>{label}: {textoSelecionado}</span>
                ) : (
                    <span className="ui-select-value">{textoSelecionado}</span>
                )}
                <ArrowDown01Icon size={15} className="filtro-action-chev ui-select-chev" />
            </button>

            {aberto && (
                <div className="filtro-dropdown ui-select-panel" role="listbox">
                    {options.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            role="option"
                            aria-selected={value === o.value}
                            className={cn("filtro-option", value === o.value && "selected")}
                            onClick={() => { onChange(o.value); setAberto(false); }}
                        >
                            {o.label}
                            {value === o.value && <Tick02Icon size={15} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Select;
