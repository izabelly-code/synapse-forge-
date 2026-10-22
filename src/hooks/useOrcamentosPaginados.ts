import { useEffect, useRef, useState } from "react";
import { buscarOrcamentos, type FiltroOrcamentos, type SituacaoOrcamento } from "../services/OrcamentoService";
import { Orcamento } from "../models/Orcamento";

export const TAMANHO_PAGINA_ORCAMENTOS = 20;
/** Limite do backend por requisição. */
const TAMANHO_MAXIMO = 100;

interface Estado {
    itens: Orcamento[];
    total: number;
    temMais: boolean;
    /** Primeira carga (ou troca de filtro) ainda sem resposta. */
    carregando: boolean;
    carregandoMais: boolean;
    erro: boolean;
}

const INICIAL: Estado = { itens: [], total: 0, temMais: false, carregando: true, carregandoMais: false, erro: false };

/** Junta sem repetir: depois de uma remoção as páginas "andam" e podem trazer itens já exibidos. */
function juntar(atuais: Orcamento[], novos: Orcamento[]) {
    const ids = new Set(atuais.map((o) => o.id));
    return [...atuais, ...novos.filter((o) => !ids.has(o.id))];
}

/**
 * Uma seção paginada de orçamentos (pendentes ou histórico). Troca de filtro
 * recomeça da primeira página; `recarga` (voltar à aba, decisão tomada) refaz a
 * busca mantendo quantos itens já estavam na tela.
 */
export function useOrcamentosPaginados(situacao: SituacaoOrcamento, filtro: FiltroOrcamentos, recarga: number) {
    const [estado, setEstado] = useState<Estado>(INICIAL);
    // Só a resposta da requisição mais recente vale: filtros digitados em
    // sequência não podem ser sobrescritos por uma resposta atrasada.
    const requisicaoRef = useRef(0);
    const filtroChave = JSON.stringify(filtro);
    const ultimoFiltroRef = useRef(filtroChave);
    const quantidadeRef = useRef(0);
    useEffect(() => {
        quantidadeRef.current = estado.itens.length;
    }, [estado.itens.length]);

    useEffect(() => {
        const id = ++requisicaoRef.current;
        const trocouFiltro = ultimoFiltroRef.current !== filtroChave;
        ultimoFiltroRef.current = filtroChave;

        // Recarga mantém o que já estava carregado (arredondado para páginas inteiras).
        const tamanho = trocouFiltro
            ? TAMANHO_PAGINA_ORCAMENTOS
            : Math.min(
                TAMANHO_MAXIMO,
                Math.max(TAMANHO_PAGINA_ORCAMENTOS, Math.ceil(quantidadeRef.current / TAMANHO_PAGINA_ORCAMENTOS) * TAMANHO_PAGINA_ORCAMENTOS)
            );

        async function carregar() {
            if (trocouFiltro) setEstado((e) => ({ ...e, carregando: true }));
            try {
                const pagina = await buscarOrcamentos(situacao, JSON.parse(filtroChave), 0, tamanho);
                if (id !== requisicaoRef.current) return;
                setEstado({ itens: pagina.itens, total: pagina.total, temMais: pagina.temMais, carregando: false, carregandoMais: false, erro: false });
            } catch {
                if (id !== requisicaoRef.current) return;
                setEstado((e) => ({ ...e, carregando: false, carregandoMais: false, erro: true }));
            }
        }
        void carregar();
    }, [situacao, filtroChave, recarga]);

    async function carregarMais() {
        if (estado.carregandoMais || !estado.temMais) return;
        const id = ++requisicaoRef.current;
        setEstado((e) => ({ ...e, carregandoMais: true }));
        try {
            const pagina = await buscarOrcamentos(
                situacao,
                filtro,
                Math.floor(estado.itens.length / TAMANHO_PAGINA_ORCAMENTOS),
                TAMANHO_PAGINA_ORCAMENTOS
            );
            if (id !== requisicaoRef.current) return;
            setEstado((e) => ({ ...e, itens: juntar(e.itens, pagina.itens), total: pagina.total, temMais: pagina.temMais, carregandoMais: false, erro: false }));
        } catch {
            if (id !== requisicaoRef.current) return;
            setEstado((e) => ({ ...e, carregandoMais: false, erro: true }));
        }
    }

    /** Tira da lista na hora (ex.: pendente que acabou de ser aprovado). */
    function remover(orcamentoId: string) {
        setEstado((e) => {
            if (!e.itens.some((o) => o.id === orcamentoId)) return e;
            const total = Math.max(0, e.total - 1);
            return { ...e, itens: e.itens.filter((o) => o.id !== orcamentoId), total, temMais: e.itens.length - 1 < total };
        });
    }

    return { ...estado, carregarMais, remover };
}
