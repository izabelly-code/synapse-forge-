import { type ReactNode, useEffect, useRef, useState } from "react";
import { InboxIcon } from "hugeicons-react";
import { aprovarOrcamento, getOrcamentos, rejeitarOrcamento } from "../../services/OrcamentoService";
import { Orcamento, OrcamentoStatus } from "../../models/Orcamento";
import { useFlipList } from "../../hooks/useFlipList";
import { FiCheck, FiClock, FiX } from "react-icons/fi";

const moedaBR = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

const dataBR = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

function formatarData(criadoEm: string | null) {
    if (!criadoEm) return "—";
    const data = new Date(criadoEm);
    return Number.isNaN(data.getTime()) ? "—" : dataBR.format(data);
}

function statusOrcamento(orcamento: Orcamento): OrcamentoStatus {
    return orcamento.status ?? "PENDENTE";
}

function statusLabel(status: OrcamentoStatus) {
    if (status === "PENDENTE") return "Pendente";
    return status === "APROVADO" ? "Aprovado" : "Rejeitado";
}

function statusIcon(status: OrcamentoStatus) {
    if (status === "PENDENTE") return <FiClock size={14} />;
    return status === "APROVADO" ? <FiCheck size={14} /> : <FiX size={14} />;
}

function OrcamentoHistorico() {
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const listaRef = useRef<HTMLDivElement>(null);
    const [loadingIds, setLoadingIds] = useState(new Set<string>());

    useEffect(() => {
        async function fetchOrcamentos() {
            setFetching(true);
            setError("");
            try {
                setOrcamentos(await getOrcamentos());
            } catch {
                setError("Erro ao carregar histórico. Verifique se o servidor está rodando.");
            } finally {
                setFetching(false);
            }
        }
        fetchOrcamentos();
    }, []);

    // Quando o histórico muda de ordem, as linhas viajam para o novo lugar.
    useFlipList(listaRef, orcamentos.map((o) => o.id).join("|"));

    // Quando o histórico muda de ordem, as linhas viajam para o novo lugar.
    useFlipList(listaRef, orcamentos.map((o) => o.id).join("|"));

    async function decidirOrcamento(orcamento: Orcamento, decisao: "aprovar" | "rejeitar") {
        if (!orcamento.id) return;
        setLoadingIds((ids) => new Set(ids).add(orcamento.id as string));
        setError("");
        try {
            const atualizado = await (decisao === "aprovar"
                ? aprovarOrcamento(orcamento.id)
                : rejeitarOrcamento(orcamento.id));
            setOrcamentos((lista) => lista.map((item) => (
                item.id === orcamento.id
                    ? atualizado
                    : item
            )));
        } catch {
            setError(`Falha ao ${decisao} orçamento. Tente novamente.`);
        } finally {
            setLoadingIds((ids) => {
                const next = new Set(ids);
                next.delete(orcamento.id as string);
                return next;
            });
        }
    }

    const pendentes = orcamentos.filter((o) => statusOrcamento(o) === "PENDENTE");
    const decididos = orcamentos.filter((o) => statusOrcamento(o) !== "PENDENTE");

    function renderLinha(o: Orcamento, comAcoes = false) {
        const status = statusOrcamento(o);
        const carregando = o.id ? loadingIds.has(o.id) : false;
        return (
            <div key={o.id} className="pedido-row orcamento-row">
                <span className="row-projeto-nome">{o.nomeMaterial}</span>
                <span>{o.volumeCm3} cm³</span>
                <span>{formatarData(o.criadoEm)}</span>
                <span className="orcamento-row-preco">{moedaBR.format(o.precoFinal)}</span>
                <span className={`orcamento-status orcamento-status-${status.toLowerCase()}`}>
                    {statusIcon(status)}
                    {statusLabel(status)}
                </span>
                {comAcoes && (
                    <span className="orcamento-acoes">
                        <button type="button" className="orcamento-decisao orcamento-aprovar" onClick={() => decidirOrcamento(o, "aprovar")} disabled={carregando} aria-label={`Aprovar orçamento de ${o.nomeMaterial}`}>
                            <FiCheck size={16} /> Aprovar
                        </button>
                        <button type="button" className="orcamento-decisao orcamento-rejeitar" onClick={() => decidirOrcamento(o, "rejeitar")} disabled={carregando} aria-label={`Rejeitar orçamento de ${o.nomeMaterial}`}>
                            <FiX size={16} /> Rejeitar
                        </button>
                    </span>
                )}
            </div>
        );
    }

    function renderLista(lista: Orcamento[], comAcoes = false) {
        return (
            <div className="pedidos-list">
                <div className={`pedidos-row-head orcamento-row ${comAcoes ? "orcamento-row-pendente" : ""}`} aria-hidden="true">
                    <span>Material</span>
                    <span>Volume</span>
                    <span>Data</span>
                    <span>Preço Final</span>
                    <span>Status</span>
                    {comAcoes && <span>Ações</span>}
                </div>
                {lista.map((o) => renderLinha(o, comAcoes))}
            </div>
        );
    }

    let pendentesConteudo: ReactNode;
    if (fetching) {
        pendentesConteudo = (
            <div className="pedidos-list">
                {[1, 2, 3].map((i) => <div key={i} className="pedido-row-skeleton" />)}
            </div>
        );
    } else if (orcamentos.length === 0) {
        pendentesConteudo = (
            <div className="pedidos-empty">
                <span className="pedidos-empty-icon"><InboxIcon size={28} /></span>
                <p className="empty-title">Nenhum orçamento salvo ainda</p>
                <p className="empty-sub">Calcule e salve um orçamento para vê-lo aqui.</p>
            </div>
        );
    } else {
        pendentesConteudo = (
            <>
                <div className="orcamento-secao-head">
                    <p>Revise os valores antes de liberar o orçamento.</p>
                    <span className="orcamento-contador">{pendentes.length}</span>
                </div>
                {pendentes.length === 0 ? <p className="orcamento-lista-vazia">Nenhum orçamento aguardando aprovação.</p> : renderLista(pendentes, true)}
            </>
        );
    }

    const historicoConteudo = fetching || orcamentos.length === 0 ? null : (
        <>
            <div className="orcamento-secao-head">
                <p>Orçamentos aprovados ou rejeitados.</p>
                <span className="orcamento-contador">{decididos.length}</span>
            </div>
            {decididos.length === 0 ? <p className="orcamento-lista-vazia">Nenhuma decisão registrada.</p> : renderLista(decididos)}
        </>
    );

    return (
        <>
            <section className="orcamento-pendentes">
                <div className="orcamento-historico-head">
                    <h2 className="dashboard-title orcamento-historico-title">Orçamentos pendentes de aprovação</h2>
                </div>
                {error && <div className="dashboard-error">{error}</div>}
                {pendentesConteudo}
            </section>
            <section className="orcamento-historico">
                <div className="orcamento-historico-head">
                    <h2 className="dashboard-title orcamento-historico-title">Histórico de Orçamentos</h2>
                </div>
                {historicoConteudo}
            </section>
        </>
    );
}

export default OrcamentoHistorico;
