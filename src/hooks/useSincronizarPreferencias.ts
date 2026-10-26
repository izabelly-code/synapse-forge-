import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./useTheme";
import type { Theme } from "../contexts/theme-context";
import { getPreferencias, salvarPreferencias, type IdiomaPreferido } from "../services/PreferenciasService";

const IDIOMAS: IdiomaPreferido[] = ["pt-BR", "en-US"];

/**
 * Tema e idioma salvos na conta (SYN-166), além do localStorage: quem troca o tema
 * num computador encontra o mesmo tema ao entrar em outro.
 *
 * Ao montar o layout logado, busca as preferências e aplica o que estiver salvo.
 * Depois disso, cada troca de tema ou idioma vai para o back. `salvo` guarda o
 * último valor conhecido do servidor: é ele que impede que aplicar o valor
 * carregado gere um PUT de volta. Se a busca falhar, nada é sincronizado
 * (o tema e o idioma seguem só no localStorage, como antes).
 */
export function useSincronizarPreferencias() {
    const { theme, setTheme } = useTheme();
    const { i18n } = useTranslation();
    const salvo = useRef<{ tema: Theme | null; idioma: string | null } | null>(null);

    useEffect(() => {
        let cancelado = false;

        async function carregar() {
            try {
                const prefs = await getPreferencias();
                if (cancelado) return;
                const tema: Theme | null = prefs.tema === "escuro" ? "dark" : prefs.tema === "claro" ? "light" : null;
                salvo.current = { tema, idioma: prefs.idioma };
                if (tema) setTheme(tema);
                if (prefs.idioma && prefs.idioma !== i18n.language) void i18n.changeLanguage(prefs.idioma);
            } catch {
                // back sem o endpoint ou fora do ar: segue só com o localStorage
            }
        }

        void carregar();
        return () => {
            cancelado = true;
        };
    }, [i18n, setTheme]);

    useEffect(() => {
        const atual = salvo.current;
        if (!atual || atual.tema === theme) return;
        atual.tema = theme;
        void salvarPreferencias({ tema: theme === "dark" ? "escuro" : "claro" }).catch(() => {});
    }, [theme]);

    useEffect(() => {
        function aoTrocarIdioma(lng: string) {
            const atual = salvo.current;
            if (!atual || atual.idioma === lng || !IDIOMAS.includes(lng as IdiomaPreferido)) return;
            atual.idioma = lng;
            void salvarPreferencias({ idioma: lng as IdiomaPreferido }).catch(() => {});
        }

        i18n.on("languageChanged", aoTrocarIdioma);
        return () => i18n.off("languageChanged", aoTrocarIdioma);
    }, [i18n]);
}
