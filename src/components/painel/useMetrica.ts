import { useEffect, useState } from "react";
import type { Intervalo } from "../../services/MetricasService";

interface Estado<T> {
    chave: string;
    dados?: T;
    erro?: boolean;
}

export interface Metrica<T> {
    dados: T | undefined;
    /** Primeira carga, ainda sem nada para mostrar: hora do skeleton. */
    carregando: boolean;
    /** Recarregando com dados antigos na tela (troca de período): mostra os antigos esmaecidos. */
    atualizando: boolean;
    erro: boolean;
}

/**
 * Busca de uma métrica do painel. A chave (intervalo + tentativa) identifica a
 * requisição: enquanto a resposta da chave atual não chega, os dados da anterior
 * continuam na tela e `atualizando` sai derivado da diferença das chaves, sem
 * setState síncrono no effect. `ativo = false` segura a busca (o painel espera
 * as preferências para não buscar duas vezes com períodos diferentes).
 */
export function useMetrica<T>(
    buscar: (intervalo: Intervalo) => Promise<T>,
    intervalo: Intervalo,
    tentativa: number,
    ativo = true,
): Metrica<T> {
    const chave = `${intervalo.de ?? ""}|${intervalo.ate ?? ""}|${tentativa}`;
    const [estado, setEstado] = useState<Estado<T> | null>(null);

    useEffect(() => {
        if (!ativo) return;
        let cancelado = false;

        async function carregar() {
            try {
                const dados = await buscar(intervalo);
                if (!cancelado) setEstado({ chave, dados });
            } catch {
                if (!cancelado) setEstado((anterior) => ({ chave, dados: anterior?.dados, erro: true }));
            }
        }

        void carregar();
        return () => {
            cancelado = true;
        };
    }, [buscar, intervalo, chave, ativo]);

    return {
        dados: estado?.dados,
        carregando: !estado,
        atualizando: !!estado && estado.chave !== chave,
        erro: !!estado && estado.chave === chave && !!estado.erro,
    };
}
