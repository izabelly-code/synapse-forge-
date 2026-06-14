import { useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { getMateriais, inativarMaterial } from "../../services/MaterialService";
import MaterialModal from "./MaterialModal";
import { Material } from "../../models/Material";

const moedaBR = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 3,
});

function MateriaisDashboard() {
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [materialEditando, setMaterialEditando] = useState<Material | null>(null);

    async function fetchMateriais() {
        setFetching(true);
        setError("");
        try {
            setMateriais(await getMateriais());
        } catch {
            setError("Erro ao carregar materiais. Verifique se o servidor está rodando.");
        } finally {
            setFetching(false);
        }
    }

    useEffect(() => {
        fetchMateriais();
    }, []);

    function fecharModal() {
        setModalAberto(false);
        setMaterialEditando(null);
    }

    async function handleExcluir(id: string) {
        if (!window.confirm("Deseja realmente excluir este material?")) return;
        try {
            await inativarMaterial(id);
            setMateriais((prev) => prev.filter((m) => m.id !== id));
        } catch {
            setError("Falha ao excluir material.");
        }
    }

    return (
        <>
            {(modalAberto || materialEditando) && (
                <MaterialModal
                    material={materialEditando ?? undefined}
                    onClose={fecharModal}
                    onSalvo={() => { fecharModal(); fetchMateriais(); }}
                />
            )}

            <main className="dashboard-main materiais-page">
                <header className="materiais-toolbar">
                    <div>
                        <h1 className="dashboard-title">Materiais</h1>
                        <p className="dashboard-subtitle">Cadastre os materiais usados na produção</p>
                    </div>

                    <div className="toolbar-actions">
                        <button className="button btn-novo-pedido" onClick={() => setModalAberto(true)}>
                            + Novo Material
                        </button>
                    </div>
                </header>

                {error && <div className="dashboard-error">{error}</div>}

                {fetching ? (
                    <div className="pedidos-list">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="pedido-row-skeleton" />
                        ))}
                    </div>
                ) : materiais.length === 0 ? (
                    <div className="pedidos-empty">
                        <span className="pedidos-empty-icon"><FiInbox size={28} /></span>
                        <p className="empty-title">Nenhum material cadastrado</p>
                        <p className="empty-sub">Cadastre o primeiro material para começar.</p>
                        <button className="button btn-novo-pedido empty-cta" onClick={() => setModalAberto(true)}>
                            + Novo Material
                        </button>
                    </div>
                ) : (
                    <div className="pedidos-list">
                        <div className="pedidos-row-head material-row" aria-hidden="true">
                            <span>Nome</span>
                            <span>Tipo</span>
                            <span>Densidade (g/cm³)</span>
                            <span>Preço/grama (R$)</span>
                            <span />
                        </div>
                        {materiais.map((m) => (
                            <div key={m.id} className="pedido-row material-row">
                                <span className="row-projeto-nome">{m.nome}</span>
                                <span>{m.tipo}</span>
                                <span>{m.densidadeGcm3.toFixed(2)} g/cm³</span>
                                <span>{moedaBR.format(m.precoPorGrama)}</span>
                                <div className="material-row-actions">
                                    <button
                                        type="button"
                                        className="btn-acao-pequeno"
                                        onClick={() => setMaterialEditando(m)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-acao-pequeno btn-acao-perigo"
                                        onClick={() => handleExcluir(m.id)}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}

export default MateriaisDashboard;
