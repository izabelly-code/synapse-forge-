import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR/common.json";
import enUS from "./locales/en-US/common.json";

const STORAGE_KEY = "sf-lang";

export const SUPPORTED_LANGUAGES = ["pt-BR", "en-US"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

function getInitialLanguage(): Language {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "pt-BR" || stored === "en-US") return stored;
    return "pt-BR";
}

i18n.use(initReactI18next).init({
    resources: {
        "pt-BR": { common: ptBR },
        "en-US": { common: enUS },
    },
    lng: getInitialLanguage(),
    fallbackLng: "pt-BR",
    defaultNS: "common",
    interpolation: {
        escapeValue: false, // React já escapa
    },
});

i18n.on("languageChanged", (lng) => {
    localStorage.setItem(STORAGE_KEY, lng);
    document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language;

export default i18n;
