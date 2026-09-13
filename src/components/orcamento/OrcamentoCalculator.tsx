import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown01Icon, Tick02Icon } from "hugeicons-react";
import { getMateriais } from "../../services/MaterialService";
import { calcularOrcamento, salvarOrcamento } from "../../services/OrcamentoService";
import { Material } from "../../models/Material";
import { CalcularOrcamentoInput, Orcamento } from "../../models/Orcamento";
import { cn } from "../../utils/cn";
import { useDismissable } from "../../hooks/useDismissable";
import { formatCurrency } from "../../utils/format";

interface OrcamentoCalculatorProps {
    onSalvo: () => void;
}

function OrcamentoCalculator({ onSalvo }: OrcamentoCalculatorProps) {
    const { t } = useTranslation();
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [materialId, setMaterialId] = useState("");
    const [volume, setVolume] = useState("");
    const [tempoImpressao, setTempoImpressao] = useState("");
    const [tempoMaoDeObra, setTempoMaoDeObra] = useState("");
    const [custoMaquina, setCustoMaquina] = useState("");
    const [custoMaoDeObra, setCustoMaoDeObra] = useState("");
    const [margem, setMargem] = useState("");

    const [menuAberto, setMenuAberto] = useState(false);
    const [preview, setPreview] = useState<Orcamento | null>(null);
    const [calculando, setCalculando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getMateriais()
            .then((lista) => setMateriais(lista.filter((m) => m.ativo)))
            .catch(() => setErro(t("orcamento.calculator.errorLoadMaterials")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useDismissable({
        enabled: menuAberto,
        refs: menuRef,
        onDismiss: () => setMenuAberto(false),
    });

    function montarInput(): CalcularOrcamentoInput | null {
        const volumeCm3 = Number(volume);
        const tempoImpressaoHoras = Number(tempoImpressao);
        const tempoMaoDeObraHoras = Number(tempoMaoDeObra);
        const custoMaquinaHora = Number(custoMaquina);
        const custoMaoDeObraHora = Number(custoMaoDeObra);
        const margemLucro = Number(margem);

        if (!materialId) return null;
        if (!(volumeCm3 > 0)) return null;
        if (!(tempoImpressaoHoras > 0)) return null;
        if (!(tempoMaoDeObraHoras > 0)) return null;
        if (!(custoMaquinaHora > 0)) return null;
        if (!(custoMaoDeObraHora > 0)) return null;
        if (!(margemLucro > 0)) return null;

        return {
            materialId,
            volumeCm3,
            tempoImpressaoHoras,
            tempoMaoDeObraHoras,
            custoMaquinaHora,
            custoMaoDeObraHora,
            margemLucro,
        };
    }

    useEffect(() => {
        const input = montarInput();
        let cancelado = false;
        const timer = setTimeout(async () => {
            if (!input) {
                setPreview(null);
                return;
            }
            setCalculando(true);
            setErro("");
            try {
                const resultado = await calcularOrcamento(input);
                if (!cancelado) setPreview(resultado);
            } catch {
                if (!cancelado) {
                    setPreview(null);
                    setErro(t("orcamento.calculator.errorCalculate"));
                }
            } finally {
                if (!cancelado) setCalculando(false);
            }
        }, 400);

        return () => {
            cancelado = true;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [materialId, volume, tempoImpressao, tempoMaoDeObra, custoMaquina, custoMaoDeObra, margem]);

    async function handleSalvar() {
        const input = montarInput();
        if (!input) return;
        setSalvando(true);
        setErro("");
        setSucesso("");
        try {
            await salvarOrcamento(input);
            setSucesso(t("orcamento.calculator.saved"));
            limparForm();
            onSalvo();
        } catch {
            setErro(t("orcamento.calculator.errorSave"));
        } finally {
            setSalvando(false);
        }
    }

    function limparForm() {
        setMaterialId("");
        setVolume("");
        setTempoImpressao("");
        setTempoMaoDeObra("");
        setCustoMaquina("");
        setCustoMaoDeObra("");
        setMargem("");
        setPreview(null);
    }

    function selecionarMaterial(id: string) {
        setMaterialId(id);
        setMenuAberto(false);
        setSucesso("");
    }

    const materialSelecionado = materiais.find((m) => m.id === materialId);
    const valor = (v: number | undefined) => (v === undefined ? "—" : formatCurrency(v));

    return (
        <section className="orcamento-calculator">
            <header className="materiais-toolbar">
                <div>
                    <h1 className="dashboard-title">{t("orcamento.calculator.title")}</h1>
                    <p className="dashboard-subtitle">{t("orcamento.calculator.subtitle")}</p>
                </div>
            </header>

            {erro && <div className="dashboard-error">{erro}</div>}
            {sucesso && <div className="orcamento-sucesso">{sucesso}</div>}

            <div className="orcamento-form-grid">
                <div className="orcamento-form-fields">
                    <div className="input-group" ref={menuRef}>
                        <label>{t("orcamento.calculator.materialLabel")}</label>
                        <div className="filtro-menu orcamento-material-menu">
                            <button
                                type="button"
                                className="filtro-action orcamento-material-action"
                                aria-haspopup="menu"
                                aria-expanded={menuAberto}
                                onClick={() => setMenuAberto((m) => !m)}
                            >
                                {materialSelecionado ? materialSelecionado.nome : t("orcamento.calculator.materialPlaceholder")}
                                <ArrowDown01Icon size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto && (
                                <div className="filtro-dropdown" role="menu">
                                    {materiais.length === 0 ? (
                                        <span className="orcamento-material-vazio">{t("orcamento.calculator.materialEmpty")}</span>
                                    ) : (
                                        materiais.map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                role="menuitemradio"
                                                aria-checked={materialId === m.id}
                                                className={cn("filtro-option", materialId === m.id && "selected")}
                                                onClick={() => selecionarMaterial(m.id)}
                                            >
                                                {m.nome}
                                                {materialId === m.id && <Tick02Icon size={15} />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="volume">{t("orcamento.calculator.volumeLabel")}</label>
                        <input
                            id="volume"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            placeholder={t("orcamento.calculator.volumePlaceholder")}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="tempoImpressao">{t("orcamento.calculator.printTimeLabel")}</label>
                        <input
                            id="tempoImpressao"
                            type="number"
                            step="0.1"
                            min="0"
                            value={tempoImpressao}
                            onChange={(e) => setTempoImpressao(e.target.value)}
                            placeholder={t("orcamento.calculator.printTimePlaceholder")}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="tempoMaoDeObra">{t("orcamento.calculator.laborTimeLabel")}</label>
                        <input
                            id="tempoMaoDeObra"
                            type="number"
                            step="0.1"
                            min="0"
                            value={tempoMaoDeObra}
                            onChange={(e) => setTempoMaoDeObra(e.target.value)}
                            placeholder={t("orcamento.calculator.laborTimePlaceholder")}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="custoMaquina">{t("orcamento.calculator.machineCostLabel")}</label>
                        <input
                            id="custoMaquina"
                            type="number"
                            step="0.01"
                            min="0"
                            value={custoMaquina}
                            onChange={(e) => setCustoMaquina(e.target.value)}
                            placeholder={t("orcamento.calculator.machineCostPlaceholder")}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="custoMaoDeObra">{t("orcamento.calculator.laborCostLabel")}</label>
                        <input
                            id="custoMaoDeObra"
                            type="number"
                            step="0.01"
                            min="0"
                            value={custoMaoDeObra}
                            onChange={(e) => setCustoMaoDeObra(e.target.value)}
                            placeholder={t("orcamento.calculator.laborCostPlaceholder")}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="margem">{t("orcamento.calculator.marginLabel")}</label>
                        <input
                            id="margem"
                            type="number"
                            step="0.1"
                            min="0"
                            value={margem}
                            onChange={(e) => setMargem(e.target.value)}
                            placeholder={t("orcamento.calculator.marginPlaceholder")}
                        />
                    </div>
                </div>

                <div className={cn("orcamento-preview-card", calculando && "is-calculando")}>
                    <div className="orcamento-preview-row">
                        <span>{t("orcamento.calculator.materialCost")}</span>
                        <span>{valor(preview?.custoMaterial)}</span>
                    </div>
                    <div className="orcamento-preview-row">
                        <span>{t("orcamento.calculator.machineCost")}</span>
                        <span>{valor(preview?.custoMaquina)}</span>
                    </div>
                    <div className="orcamento-preview-row">
                        <span>{t("orcamento.calculator.laborCost")}</span>
                        <span>{valor(preview?.custoMaoDeObra)}</span>
                    </div>
                    <div className="orcamento-preview-row orcamento-preview-total">
                        <span>{t("orcamento.calculator.totalCost")}</span>
                        <span>{valor(preview?.custoTotal)}</span>
                    </div>
                    <div className="orcamento-preview-row orcamento-preview-final">
                        <span>{t("orcamento.calculator.finalPrice")}</span>
                        <span>{valor(preview?.precoFinal)}</span>
                    </div>

                    <button
                        type="button"
                        className="button orcamento-salvar"
                        onClick={handleSalvar}
                        disabled={!preview || calculando || salvando}
                    >
                        {salvando ? t("orcamento.calculator.saving") : t("orcamento.calculator.save")}
                    </button>
                </div>
            </div>
        </section>
    );
}

export default OrcamentoCalculator;
