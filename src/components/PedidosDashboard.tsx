import { useEffect, useState } from "react";
import { getPedidos, avancarStatus, deletarPedido } from "../services/PedidoService";
import logo from "../assets/Images/black-logo.png";
import PedidoCard from "./PedidoCard";
import NovoPedidoModal from "./NovoPedidoModal";
import { Pedido, PedidoStatus } from "../types";

interface Filtro {
    label: string;
    value: PedidoStatus | "";
}

const FILTROS: Filtro[] = [
    { label: "Todos", value: "" },
    { label: "Modelagem", value: "MODELAGEM" },
    { label: "Impressão", value: "IMPRESSAO" },
    { label: "Pintura", value: "PINTURA" },
    { label: "Acabamento", value: "ACABAMENTO" },
    { label: "Finalizado", value: "FINALIZADO" },
];

interface PedidosDashboardProps {
    onLogout: () => void;
    onCalendario: () => void;
}

function PedidosDashboard({ onLogout, onCalendario }: PedidosDashboardProps) {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [filtro, setFiltro] = useState<PedidoStatus | "">("");
    const [loadingIds, setLoadingIds] = useState(new Set<string>());
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [modalAberto, setModalAberto] = useState(false);

    async function fetchPedidos(status: PedidoStatus | "") {
        setFetching(true);
        setError("");
        try {
            const data = await getPedidos(status || undefined);
            setPedidos(data);
        } catch {
            setError("Erro ao carregar pedidos. Verifique se o servidor está rodando.");
        } finally {
            setFetching(false);
        }
    }

    useEffect(() => {
        fetchPedidos(filtro);
    }, [filtro]);

    async function handleDeletar(id: string) {
        try {
            await deletarPedido(id);
            setPedidos((prev) => prev.filter((p) => p.id !== id));
        } catch {
            setError("Falha ao deletar pedido.");
        }
    }

    async function handleAvancar(id: string) {
        setLoadingIds((prev) => new Set(prev).add(id));
        try {
            const updated = await avancarStatus(id);
            setPedidos((prev) => prev.map((p) => (p.id === id ? updated : p)));
        } catch {
            setError("Falha ao avançar status.");
        } finally {
            setLoadingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    function handleLogout() {
        localStorage.removeItem("token");
        onLogout();
    }

    return (
        <div className="dashboard-layout">
            {modalAberto && (
                <NovoPedidoModal
                    onClose={() => setModalAberto(false)}
                    onCriado={() => { setModalAberto(false); fetchPedidos(filtro); }}
                />
            )}
            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-inner">
                    <img src={logo} alt="SynapseForge" className="header-logo" />
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button className="filtro-btn" onClick={onCalendario}>
                            Calendário
                        </button>
                        <button className="link" onClick={handleLogout}>
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="dashboard-main">
                <div className="dashboard-title-block">
                    <div className="dashboard-title-row">
                        <div>
                            <h1 className="dashboard-title">Produção</h1>
                            <p className="dashboard-subtitle">
                                Acompanhe e avance os pedidos em cada etapa
                            </p>
                        </div>
                        <button className="button btn-novo-pedido" onClick={() => setModalAberto(true)}>
                            + Novo Pedido
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="filtros-bar">
                    {FILTROS.map((f) => (
                        <button
                            key={f.value}
                            className={`filtro-btn ${filtro === f.value ? "filtro-ativo" : ""}`}
                            onClick={() => setFiltro(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {error && <div className="dashboard-error">{error}</div>}

                {fetching ? (
                    <div className="pedidos-grid">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="pedido-skeleton" />
                        ))}
                    </div>
                ) : pedidos.length === 0 ? (
                    <div className="pedidos-empty">
                        <p style={{ fontSize: "2rem" }}>📋</p>
                        <p className="empty-title">Nenhum pedido encontrado</p>
                        <p className="empty-sub">
                            {filtro ? "Tente outro filtro." : "Crie o primeiro pedido pela API."}
                        </p>
                    </div>
                ) : (
                    <div className="pedidos-grid">
                        {pedidos.map((pedido) => (
                            <PedidoCard
                                key={pedido.id}
                                pedido={pedido}
                                onAvancar={handleAvancar}
                                onDeletar={handleDeletar}
                                loading={loadingIds.has(pedido.id)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default PedidosDashboard;
