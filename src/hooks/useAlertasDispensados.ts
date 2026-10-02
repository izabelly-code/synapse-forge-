import { useState } from "react";

/** Guarda só os mais recentes: chaves antigas (prazos já resolvidos) não crescem para sempre. */
const MAXIMO_GUARDADO = 200;

function chaveStorage() {
    // Por usuário: duas contas no mesmo navegador não compartilham o que foi dispensado
    return `sf:alertasDispensados:${localStorage.getItem("userId") ?? "anon"}`;
}

function ler(): string[] {
    try {
        const salvo = JSON.parse(localStorage.getItem(chaveStorage()) ?? "[]");
        return Array.isArray(salvo) ? salvo : [];
    } catch {
        return [];
    }
}

/**
 * Alertas de prazo (atrasado / vence hoje) dispensados no X do sino.
 * Eles não existem no banco (são calculados a partir dos prazos), então o
 * "dispensado" fica neste navegador. A chave inclui prazo e situação: se o prazo
 * mudar, ou o "vence hoje" virar "atrasado", o alerta volta a aparecer.
 */
export function useAlertasDispensados() {
    const [dispensados, setDispensados] = useState<string[]>(ler);

    function dispensar(chave: string) {
        setDispensados((atuais) => {
            const proximos = [...atuais.filter((c) => c !== chave), chave].slice(-MAXIMO_GUARDADO);
            try {
                localStorage.setItem(chaveStorage(), JSON.stringify(proximos));
            } catch {
                // sem storage (modo privado, cota cheia): dispensa só até recarregar a página
            }
            return proximos;
        });
    }

    function foiDispensado(chave: string) {
        return dispensados.includes(chave);
    }

    return { dispensar, foiDispensado };
}
