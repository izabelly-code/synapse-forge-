import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { getMateriais } from "../../services/MaterialService";
import { calcularOrcamento, salvarOrcamento } from "../../services/OrcamentoService";
import { Material } from "../../models/Material";
import { CalcularOrcamentoInput, Orcamento } from "../../models/Orcamento";

const moedaBR = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

interface OrcamentoCalculatorProps {
    onSalvo: () => void;
}

function OrcamentoCalculator({ onSalvo }: OrcamentoCalculatorProps) {
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
            .catch(() => setErro("Erro ao carregar materiais. Verifique se o servidor está rodando."));
    }, []);

    useEffect(() => {
        function onClickFora(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuAberto(false);
            }
        }
        document.addEventListener("mousedown", onClickFora);
        return () => document.removeEventListener("mousedown", onClickFora);
    }, []);

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
                    setErro("Falha ao calcular orçamento. Tente novamente.");
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
            setSucesso("Orçamento salvo com sucesso.");
            limparForm();
            onSalvo();
        } catch {
            setErro("Falha ao salvar orçamento. Tente novamente.");
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
    const valor = (v: number | undefined) => (v === undefined ? "—" : moedaBR.format(v));

    return (
        <section className="orcamento-calculator">
            <header className="materiais-toolbar">
                <div>
                    <h1 className="dashboard-title">Calcular Orçamento</h1>
                    <p className="dashboard-subtitle">
                        Cálculo automático baseado em volume, material e tempos de produção
                    </p>
                </div>
            </header>

            {erro && <div className="dashboard-error">{erro}</div>}
            {sucesso && <div className="orcamento-sucesso">{sucesso}</div>}

            <div className="orcamento-form-grid">
                <div className="orcamento-form-fields">
                    <div className="input-group" ref={menuRef}>
                        <label>Material</label>
                        <div className="filtro-menu orcamento-material-menu">
                            <button
                                type="button"
                                className="filtro-action orcamento-material-action"
                                aria-haspopup="menu"
                                aria-expanded={menuAberto}
                                onClick={() => setMenuAberto((m) => !m)}
                            >
                                {materialSelecionado ? materialSelecionado.nome : "Selecione um material"}
                                <FiChevronDown size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto && (
                                <div className="filtro-dropdown" role="menu">
                                    {materiais.length === 0 ? (
                                        <span className="orcamento-material-vazio">Nenhum material disponível</span>
                                    ) : (
                                        materiais.map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                role="menuitemradio"
                                                aria-checked={materialId === m.id}
                                                className={`filtro-option ${materialId === m.id ? "selected" : ""}`}
                                                onClick={() => selecionarMaterial(m.id)}
                                            >
                                                {m.nome}
                                                {materialId === m.id && <FiCheck size={15} />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="volume">Volume da peça (cm³)</label>
                        <input
                            id="volume"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            placeholder="Ex: 25.00"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="tempoImpressao">Tempo de impressão (horas)</label>
                        <input
                            id="tempoImpressao"
                            type="number"
                            step="0.1"
                            min="0"
                            value={tempoImpressao}
                            onChange={(e) => setTempoImpressao(e.target.value)}
                            placeholder="Ex: 4.5"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="tempoMaoDeObra">Tempo de mão de obra (horas)</label>
                        <input
                            id="tempoMaoDeObra"
                            type="number"
                            step="0.1"
                            min="0"
                            value={tempoMaoDeObra}
                            onChange={(e) => setTempoMaoDeObra(e.target.value)}
                            placeholder="Ex: 1.0"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="custoMaquina">Custo da hora-máquina (R$)</label>
                        <input
                            id="custoMaquina"
                            type="number"
                            step="0.01"
                            min="0"
                            value={custoMaquina}
                            onChange={(e) => setCustoMaquina(e.target.value)}
                            placeholder="Ex: 5.00"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="custoMaoDeObra">Custo da hora de mão de obra (R$)</label>
                        <input
                            id="custoMaoDeObra"
                            type="number"
                            step="0.01"
                            min="0"
                            value={custoMaoDeObra}
                            onChange={(e) => setCustoMaoDeObra(e.target.value)}
                            placeholder="Ex: 30.00"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="margem">Margem de lucro (%)</label>
                        <input
                            id="margem"
                            type="number"
                            step="0.1"
                            min="0"
                            value={margem}
                            onChange={(e) => setMargem(e.target.value)}
                            placeholder="Ex: 50.0"
                        />
                    </div>
                </div>

                <div className={`orcamento-preview-card ${calculando ? "is-calculando" : ""}`}>
                    <div className="orcamento-preview-row">
                        <span>Custo do Material</span>
                        <span>{valor(preview?.custoMaterial)}</span>
                    </div>
                    <div className="orcamento-preview-row">
                        <span>Custo da Máquina</span>
                        <span>{valor(preview?.custoMaquina)}</span>
                    </div>
                    <div className="orcamento-preview-row">
                        <span>Custo de Mão de Obra</span>
                        <span>{valor(preview?.custoMaoDeObra)}</span>
                    </div>
                    <div className="orcamento-preview-row orcamento-preview-total">
                        <span>Custo Total</span>
                        <span>{valor(preview?.custoTotal)}</span>
                    </div>
                    <div className="orcamento-preview-row orcamento-preview-final">
                        <span>Preço Final</span>
                        <span>{valor(preview?.precoFinal)}</span>
                    </div>

                    <button
                        type="button"
                        className="button orcamento-salvar"
                        onClick={handleSalvar}
                        disabled={!preview || calculando || salvando}
                    >
                        {salvando ? "Salvando..." : "Salvar Orçamento"}
                    </button>
                </div>
            </div>
        </section>
    );
}

export default OrcamentoCalculator;
