import type { Intervalo, PedidoMesMetrica } from "../../services/MetricasService";
import type { PeriodoPainel } from "../../services/PreferenciasService";

export const PERIODOS: PeriodoPainel[] = ["30d", "90d", "6m", "12m", "ano", "tudo"];

export const PERIODO_PADRAO: PeriodoPainel = "6m";

/** Filtro do painel: um atalho (salvo nas preferências) ou um intervalo escolhido na hora. */
export type FiltroPeriodo =
    | { tipo: "atalho"; periodo: PeriodoPainel }
    | { tipo: "personalizado"; de: string; ate: string };

/** "AAAA-MM-DD" no fuso local (`toISOString` usaria UTC e erraria o dia à noite). */
export function dataISO(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function inicioDoMes(data: Date, mesesAtras: number): Date {
    return new Date(data.getFullYear(), data.getMonth() - mesesAtras, 1);
}

export function intervaloDoFiltro(filtro: FiltroPeriodo, hoje: Date = new Date()): Intervalo {
    if (filtro.tipo === "personalizado") return { de: filtro.de, ate: filtro.ate };

    const ate = dataISO(hoje);
    switch (filtro.periodo) {
        case "30d":
            return { de: dataISO(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29)), ate };
        case "90d":
            return { de: dataISO(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 89)), ate };
        case "6m":
            return { de: dataISO(inicioDoMes(hoje, 5)), ate };
        case "12m":
            return { de: dataISO(inicioDoMes(hoje, 11)), ate };
        case "ano":
            return { de: `${hoje.getFullYear()}-01-01`, ate };
        case "tudo":
            return {};
    }
}

/**
 * Meses que o gráfico mostra, do primeiro ao último do intervalo, inclusive os sem
 * pedidos (o back só devolve meses com pedidos; uma coluna zerada também é informação).
 * Sem início definido ("todo o período"), começa no primeiro mês que tem dados.
 */
export function mesesDoIntervalo(intervalo: Intervalo, dados: PedidoMesMetrica[], hoje: Date = new Date()): string[] {
    const primeiroComDados = dados.length > 0 ? dados.map((d) => d.mes).sort()[0] : null;
    const inicio = intervalo.de ? intervalo.de.slice(0, 7) : primeiroComDados ?? dataISO(hoje).slice(0, 7);
    const fim = intervalo.ate ? intervalo.ate.slice(0, 7) : dataISO(hoje).slice(0, 7);

    const meses: string[] = [];
    let [ano, mes] = inicio.split("-").map(Number);
    const [anoFim, mesFim] = fim.split("-").map(Number);
    // trava de segurança: um intervalo absurdo digitado à mão não vira 10 mil colunas
    while ((ano < anoFim || (ano === anoFim && mes <= mesFim)) && meses.length < 120) {
        meses.push(`${ano}-${String(mes).padStart(2, "0")}`);
        mes += 1;
        if (mes > 12) {
            mes = 1;
            ano += 1;
        }
    }
    return meses;
}
