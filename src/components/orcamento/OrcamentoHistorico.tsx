import { useEffect, useRef, useState } from "react";
import { InboxIcon } from "hugeicons-react";
import { getOrcamentos } from "../../services/OrcamentoService";
import { Orcamento } from "../../models/Orcamento";
import SkeletonSwap from "../ui/SkeletonSwap";
import { useFlipList } from "../../hooks/useFlipList";

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
    return isNaN(data.getTime()) ? "—" : dataBR.format(data);
}

function OrcamentoHistorico() {
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const listaRef = useRef<HTMLDivElement>(null);

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

    return (
        <section className="orcamento-historico">
            <div className="orcamento-historico-head">
                <h2 className="dashboard-title orcamento-historico-title">Histórico de Orçamentos</h2>
                <p className="dashboard-subtitle">Orçamentos calculados e salvos</p>
            </div>

            {error && <div className="dashboard-error">{error}</div>}

            <SkeletonSwap
                ready={!fetching}
                label="Histórico de Orçamentos"
                skeleton={
                    <div className="pedidos-list">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="pedido-row-skeleton" />
                        ))}
                    </div>
                }
            >
                {fetching ? null : orcamentos.length === 0 ? (
                    <div className="pedidos-empty">
                        <span className="pedidos-empty-icon"><InboxIcon size={28} /></span>
                        <p className="empty-title">Nenhum orçamento salvo ainda</p>
                        <p className="empty-sub">Calcule e salve um orçamento para vê-lo aqui.</p>
                    </div>
                ) : (
                    <div ref={listaRef} className="pedidos-list">
                        <div className="pedidos-row-head orcamento-row" aria-hidden="true">
                            <span>Material</span>
                            <span>Volume</span>
                            <span>Data</span>
                            <span>Preço Final</span>
                        </div>
                        {orcamentos.map((o) => (
                            <div key={o.id} data-flip-id={o.id} className="pedido-row orcamento-row">
                                <span className="row-projeto-nome">{o.nomeMaterial}</span>
                                <span>{o.volumeCm3} cm³</span>
                                <span>{formatarData(o.criadoEm)}</span>
                                <span className="orcamento-row-preco">{moedaBR.format(o.precoFinal)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </SkeletonSwap>
        </section>
    );
}

export default OrcamentoHistorico;
