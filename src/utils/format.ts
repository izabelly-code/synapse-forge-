import i18n from "../i18n";
import { convertFromBRL, displayCurrency } from "./currency";

/** Formata data conforme o idioma ativo (Intl, sem biblioteca adicional). */
export function formatDate(
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = { dateStyle: "short" },
): string {
    return new Intl.DateTimeFormat(i18n.language, options).format(new Date(date));
}

/**
 * Formata um valor em BRL na moeda de exibição do idioma ativo (pt-BR → R$, en-US → US$),
 * convertendo pela cotação do dia. Os dados nunca deixam de ser BRL; só a exibição muda.
 */
export function formatCurrency(valueBRL: number, options?: Intl.NumberFormatOptions): string {
    const currency = displayCurrency();
    return new Intl.NumberFormat(i18n.language, { style: "currency", currency, ...options }).format(
        convertFromBRL(valueBRL, currency),
    );
}

/** Formata número conforme o idioma ativo. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(i18n.language, options).format(value);
}

/** Data de hoje no fuso local, em "AAAA-MM-DD" (o formato do input date). `toISOString` usaria UTC. */
export function hojeISO(): string {
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    return agora.toISOString().slice(0, 10);
}
