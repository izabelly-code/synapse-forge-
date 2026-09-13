import { useEffect, useState } from "react";
import { InboxIcon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { getMateriais, inativarMaterial } from "../../services/MaterialService";
import MaterialModal from "./MaterialModal";
import { Material } from "../../models/Material";
import { formatNumber } from "../../utils/format";
import SkeletonSwap from "../ui/SkeletonSwap";

function MateriaisDashboard() {
    const { t } = useTranslation();
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
            setError(t("materiais.dashboard.errorLoad"));
        } finally {
            setFetching(false);
        }
    }

    useEffect(() => {
        fetchMateriais();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function fecharModal() {
        setModalAberto(false);
        setMaterialEditando(null);
    }

    async function handleExcluir(id: string) {
        if (!window.confirm(t("materiais.dashboard.confirmDelete"))) return;
        try {
            await inativarMaterial(id);
            setMateriais((prev) => prev.filter((m) => m.id !== id));
        } catch {
            setError(t("materiais.dashboard.errorDelete"));
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
                        <h1 className="dashboard-title">{t("materiais.dashboard.title")}</h1>
                        <p className="dashboard-subtitle">{t("materiais.dashboard.subtitle")}</p>
                    </div>

                    <div className="toolbar-actions">
                        <button className="button btn-novo-pedido" onClick={() => setModalAberto(true)}>
                            {t("materiais.dashboard.newMaterial")}
                        </button>
                    </div>
                </header>

                {error && <div className="dashboard-error">{error}</div>}

                <SkeletonSwap
                    ready={!fetching}
                    label={t("materiais.dashboard.title")}
                    skeleton={
                        <div className="pedidos-list">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="pedido-row-skeleton" />
                            ))}
                        </div>
                    }
                >
                    {fetching ? null : materiais.length === 0 ? (
                        <div className="pedidos-empty">
                            <span className="pedidos-empty-icon"><InboxIcon size={28} /></span>
                            <p className="empty-title">{t("materiais.dashboard.emptyTitle")}</p>
                            <p className="empty-sub">{t("materiais.dashboard.emptySubtitle")}</p>
                            <button className="button btn-novo-pedido empty-cta" onClick={() => setModalAberto(true)}>
                                {t("materiais.dashboard.newMaterial")}
                            </button>
                        </div>
                    ) : (
                        <div className="pedidos-list">
                            <div className="pedidos-row-head material-row" aria-hidden="true">
                                <span>{t("materiais.dashboard.colName")}</span>
                                <span>{t("materiais.dashboard.colType")}</span>
                                <span>{t("materiais.dashboard.colDensity")}</span>
                                <span>{t("materiais.dashboard.colPricePerGram")}</span>
                                <span />
                            </div>
                            {materiais.map((m) => (
                                <div key={m.id} className="pedido-row material-row">
                                    <span className="row-projeto-nome">{m.nome}</span>
                                    <span>{m.tipo}</span>
                                    <span>
                                        {t("materiais.dashboard.densityValue", {
                                            value: formatNumber(m.densidadeGcm3, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }),
                                        })}
                                    </span>
                                    <span>
                                        {formatNumber(m.precoPorGrama, {
                                            style: "currency",
                                            currency: "BRL",
                                            minimumFractionDigits: 3,
                                        })}
                                    </span>
                                    <div className="material-row-actions">
                                        <button
                                            type="button"
                                            className="btn-acao-pequeno"
                                            onClick={() => setMaterialEditando(m)}
                                        >
                                            {t("materiais.dashboard.edit")}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-acao-pequeno btn-acao-perigo"
                                            onClick={() => handleExcluir(m.id)}
                                        >
                                            {t("materiais.dashboard.delete")}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SkeletonSwap>
            </main>
        </>
    );
}

export default MateriaisDashboard;
