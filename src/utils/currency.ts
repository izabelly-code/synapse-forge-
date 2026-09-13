import i18n from "../i18n";

/**
 * Moeda de exibição por idioma. Os dados continuam sempre em BRL (moeda base);
 * a conversão acontece só na hora de formatar (ver utils/format.ts).
 */
const DISPLAY_CURRENCY: Record<string, string> = {
    "pt-BR": "BRL",
    "en-US": "USD",
};

const STORAGE_KEY = "sf-fx-usd-brl";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Usado se a cotação nunca foi obtida (sem rede). Aproximação, não valor oficial. */
const FALLBACK_USD_BRL = 5.1;

type CachedRate = { rate: number; fetchedAt: number };

let usdBrl: number = readCache()?.rate ?? FALLBACK_USD_BRL;
let source: "live" | "cache" | "fallback" = readCache() ? "cache" : "fallback";

function readCache(): CachedRate | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CachedRate;
        return typeof parsed.rate === "number" && parsed.rate > 0 ? parsed : null;
    } catch {
        return null;
    }
}

function isFresh(c: CachedRate | null): boolean {
    return !!c && Date.now() - c.fetchedAt < CACHE_TTL_MS;
}

/** Busca a cotação USD→BRL do dia (AwesomeAPI, sem chave). Silencioso em caso de falha. */
export async function refreshExchangeRate(): Promise<void> {
    if (isFresh(readCache())) return;
    try {
        const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL");
        if (!res.ok) return;
        const data = (await res.json()) as { USDBRL?: { bid?: string } };
        const rate = Number(data.USDBRL?.bid);
        if (!Number.isFinite(rate) || rate <= 0) return;
        usdBrl = rate;
        source = "live";
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate, fetchedAt: Date.now() } satisfies CachedRate));
        // Re-renderiza quem depende do idioma (useTranslation) para refletir a cotação nova.
        if (displayCurrency() !== "BRL") void i18n.changeLanguage(i18n.language);
    } catch {
        /* offline ou API fora: mantém cache/fallback */
    }
}

/** Moeda de exibição do idioma ativo. */
export function displayCurrency(lng: string = i18n.language): string {
    return DISPLAY_CURRENCY[lng] ?? "BRL";
}

/** Converte um valor em BRL para a moeda de exibição do idioma ativo. */
export function convertFromBRL(valueBRL: number, currency: string = displayCurrency()): number {
    return currency === "USD" ? valueBRL / usdBrl : valueBRL;
}

/** Cotação atual e origem (para exibir "US$ 1 = R$ x,xx" se necessário). */
export function getExchangeRateInfo() {
    return { usdBrl, source };
}

void refreshExchangeRate();
