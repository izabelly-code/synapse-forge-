import i18n from "../i18n";

/** Formata data conforme o idioma ativo (Intl, sem biblioteca adicional). */
export function formatDate(
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = { dateStyle: "short" },
): string {
    return new Intl.DateTimeFormat(i18n.language, options).format(new Date(date));
}

/** Formata moeda conforme o idioma ativo. Padrão: BRL. */
export function formatCurrency(value: number, currency = "BRL"): string {
    return new Intl.NumberFormat(i18n.language, { style: "currency", currency }).format(value);
}
