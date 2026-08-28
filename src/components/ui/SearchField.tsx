import type { ReactNode, Ref } from "react";
import { Search01Icon } from "hugeicons-react";
import { cn } from "../../utils/cn";

/**
 * Variantes de campo de busca que existem no produto:
 *
 * - `pill`    — pílula de largura fixa na barra de ações de Pedidos (ícone à esquerda).
 * - `boxed`   — campo largo acima da listagem da Paleta de Cores (ícone à esquerda).
 * - `compact` — campo curto da toolbar do Kanban de Pintura (ícone à direita).
 */
export type SearchFieldVariant = "pill" | "boxed" | "compact";

const VARIANT_CLASS: Record<SearchFieldVariant, string> = {
    pill: "ui-search-field--pill",
    boxed: "ui-search-field--boxed",
    compact: "ui-search-field--compact",
};

/** Tamanho do ícone de lupa por variante — preserva o tamanho que cada tela já usava. */
const VARIANT_ICON_SIZE: Record<SearchFieldVariant, number> = {
    pill: 16,
    boxed: 18,
    compact: 17,
};

interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** Nome acessível do input. Opcional: a variante `compact` nunca teve um. */
    ariaLabel?: string;
    variant?: SearchFieldVariant;
    inputRef?: Ref<HTMLInputElement>;
    /** Conteúdo fixo à direita do input (ex.: o atalho <kbd>⌘K</kbd>). */
    trailing?: ReactNode;
    className?: string;
}

function SearchField({
    value,
    onChange,
    placeholder,
    ariaLabel,
    variant = "pill",
    inputRef,
    trailing,
    className,
}: SearchFieldProps) {
    return (
        <label className={cn("ui-search-field", VARIANT_CLASS[variant], className)}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel}
            />
            <Search01Icon size={VARIANT_ICON_SIZE[variant]} className="search-icon" />
            {trailing}
        </label>
    );
}

export default SearchField;
