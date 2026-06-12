import { useEffect, useMemo, useRef, useState } from "react";
import {
    FiPlus, FiTrash2, FiRotateCcw, FiCopy, FiCheck, FiCheckCircle,
    FiAlertCircle, FiSave, FiDroplet, FiChevronDown,
} from "react-icons/fi";
import { getCores } from "../services/CorService";
import { criarMistura } from "../services/MisturaService";
import { getCached, setCached } from "../services/cache";
import { Cor } from "../types";

const CACHE_KEY = "cores:all";
const VOLUMES = [100, 250, 500, 1000, 2000];
const NOME_MAX = 60;

interface Linha {
    key: number;
    corId: string;
    proporcao: number;
}

function hexParaRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function formatarReais(valor: number): string {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarMl(valor: number): string {
    return `${valor.toLocaleString("pt-BR")} ml`;
}

let proximaKey = 1;

function CalculadoraMistura() {
    const [cores, setCores] = useState<Cor[]>(getCached<Cor[]>(CACHE_KEY) ?? []);
    const [erro, setErro] = useState("");
    const [nome, setNome] = useState("");
    const [linhas, setLinhas] = useState<Linha[]>([]);
    const [volumeMl, setVolumeMl] = useState(1000);
    const [salvando, setSalvando] = useState(false);
    const [salvoMsg, setSalvoMsg] = useState("");
    const [copiado, setCopiado] = useState<"" | "hex" | "rgb">("");
    const [volumeMenuAberto, setVolumeMenuAberto] = useState(false);

    const volumeMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!volumeMenuAberto) return;
        function onClick(e: MouseEvent) {
            if (volumeMenuRef.current && !volumeMenuRef.current.contains(e.target as Node)) setVolumeMenuAberto(false);
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [volumeMenuAberto]);

    useEffect(() => {
        getCores()
            .then((data) => {
                setCores(data);
                setCached(CACHE_KEY, data);
            })
            .catch(() => setErro("Erro ao carregar as cores da paleta."));
    }, []);

    const corPorId = useMemo(() => new Map(cores.map((c) => [c.id, c])), [cores]);

    const total = useMemo(
        () => linhas.reduce((soma, l) => soma + (Number.isFinite(l.proporcao) ? l.proporcao : 0), 0),
        [linhas]
    );
    const totalOk = Math.abs(total - 100) < 0.01;

    const linhasValidas = linhas.filter((l) => l.corId && corPorId.has(l.corId));

    const hexResultado = useMemo(() => {
        if (linhasValidas.length === 0 || total === 0) return null;
        let r = 0, g = 0, b = 0;
        for (const linha of linhasValidas) {
            const [cr, cg, cb] = hexParaRgb(corPorId.get(linha.corId)!.hex);
            const peso = linha.proporcao / 100;
            r += cr * peso;
            g += cg * peso;
            b += cb * peso;
        }
        const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
        const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }, [linhasValidas, corPorId, total]);

    const rgbResultado = hexResultado ? hexParaRgb(hexResultado).join(", ") : null;

    const composicao = linhasValidas.map((linha) => {
        const cor = corPorId.get(linha.corId)!;
        const volume = Math.round((volumeMl * linha.proporcao) / 100);
        return { linha, cor, volume, custo: volume * cor.custoMl };
    });
    const custoEstimado = composicao.reduce((soma, item) => soma + item.custo, 0);

    function adicionarLinha() {
        const usadas = new Set(linhas.map((l) => l.corId));
        const disponivel = cores.find((c) => !usadas.has(c.id));
        setSalvoMsg("");
        setLinhas((prev) => [...prev, { key: proximaKey++, corId: disponivel?.id ?? "", proporcao: 0 }]);
    }

    function atualizarLinha(key: number, mudanca: Partial<Linha>) {
        setSalvoMsg("");
        setLinhas((prev) => prev.map((l) => (l.key === key ? { ...l, ...mudanca } : l)));
    }

    function removerLinha(key: number) {
        setSalvoMsg("");
        setLinhas((prev) => prev.filter((l) => l.key !== key));
    }

    function limparTudo() {
        setLinhas([]);
        setSalvoMsg("");
    }

    async function copiar(texto: string, tipo: "hex" | "rgb") {
        try {
            await navigator.clipboard.writeText(texto);
            setCopiado(tipo);
            setTimeout(() => setCopiado(""), 1500);
        } catch {
            setErro("Não foi possível copiar.");
        }
    }

    const podeSalvar = nome.trim() !== "" && linhasValidas.length >= 2 && totalOk && !salvando;

    async function handleSalvar() {
        if (!podeSalvar) return;
        setErro("");
        setSalvoMsg("");
        setSalvando(true);
        try {
            await criarMistura({
                nome: nome.trim(),
                itens: linhasValidas.map((l) => ({ corId: l.corId, proporcao: l.proporcao })),
                volumeMl,
            });
            setSalvoMsg("Fórmula salva com sucesso!");
        } catch (e) {
            setErro(e instanceof Error && e.message ? e.message : "Falha ao salvar a fórmula.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className="dashboard-main pedidos-page">
            <header className="pedidos-toolbar">
                <div>
                    <h1 className="dashboard-title">Calculadora de Mistura</h1>
                    <p className="dashboard-subtitle">Combine cores e calcule automaticamente o custo e o volume da sua mistura.</p>
                </div>
            </header>

            {erro && <div className="dashboard-error">{erro}</div>}

            <div className="mistura-layout">
                <section className="mistura-coluna-principal">
                    <div className="mistura-campo-nome">
                        <label htmlFor="nome-formula">Nome da fórmula</label>
                        <div className="mistura-nome-wrap">
                            <input
                                id="nome-formula"
                                type="text"
                                placeholder="Ex.: Bege Aveludado"
                                maxLength={NOME_MAX}
                                value={nome}
                                onChange={(e) => { setNome(e.target.value); setSalvoMsg(""); }}
                            />
                            <span className="mistura-nome-contador">{nome.length}/{NOME_MAX}</span>
                        </div>
                    </div>

                    <div className="mistura-card">
                        <div className="mistura-card-head">
                            <h2>Cores selecionadas</h2>
                            <div className="mistura-card-acoes">
                                {linhas.length > 0 && (
                                    <button type="button" className="btn-secondary mistura-btn-limpar" onClick={limparTudo}>
                                        <FiRotateCcw size={15} />
                                        Limpar tudo
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="button btn-novo-pedido mistura-btn-add"
                                    onClick={adicionarLinha}
                                    disabled={cores.length === 0 || linhas.length >= cores.length}
                                >
                                    <FiPlus size={16} />
                                    Adicionar cor
                                </button>
                            </div>
                        </div>

                        {linhas.length === 0 ? (
                            <div className="pedidos-empty mistura-empty">
                                <span className="pedidos-empty-icon"><FiDroplet size={28} /></span>
                                <p className="empty-title">Nenhuma cor na mistura</p>
                                <p className="empty-sub">
                                    {cores.length === 0
                                        ? "Cadastre cores na paleta para começar a misturar."
                                        : "Adicione pelo menos duas cores da paleta para criar a fórmula."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="mistura-linhas">
                                    {linhas.map((linha) => {
                                        const cor = corPorId.get(linha.corId);
                                        const usadas = new Set(linhas.filter((l) => l.key !== linha.key).map((l) => l.corId));
                                        return (
                                            <div key={linha.key} className="mistura-linha">
                                                <span
                                                    className="mistura-linha-swatch"
                                                    style={{ background: cor?.hex ?? "var(--surface-container-high)" }}
                                                />
                                                <div className="mistura-linha-cor">
                                                    <div className="mistura-select-wrap">
                                                        <select
                                                            className="cor-modal-select"
                                                            value={linha.corId}
                                                            onChange={(e) => atualizarLinha(linha.key, { corId: e.target.value })}
                                                            aria-label="Cor da paleta"
                                                        >
                                                            {!linha.corId && <option value="">Selecione uma cor</option>}
                                                            {cores.filter((c) => c.id === linha.corId || !usadas.has(c.id)).map((c) => (
                                                                <option key={c.id} value={c.id}>{c.nome}</option>
                                                            ))}
                                                        </select>
                                                        <FiChevronDown size={15} className="mistura-select-chev" />
                                                    </div>
                                                    {cor && <span className="mistura-linha-fornecedor">{cor.fornecedor}</span>}
                                                </div>
                                                <div className="mistura-linha-prop">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={Number.isFinite(linha.proporcao) ? linha.proporcao : ""}
                                                        onChange={(e) => atualizarLinha(linha.key, {
                                                            proporcao: Math.min(100, Math.max(0, Number(e.target.value))),
                                                        })}
                                                        aria-label="Proporção em porcento"
                                                    />
                                                    <span>%</span>
                                                </div>
                                                <div className="mistura-linha-slider">
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        value={Number.isFinite(linha.proporcao) ? linha.proporcao : 0}
                                                        onChange={(e) => atualizarLinha(linha.key, { proporcao: Number(e.target.value) })}
                                                        aria-label="Ajustar proporção"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="mistura-linha-remover"
                                                    onClick={() => removerLinha(linha.key)}
                                                    aria-label="Remover cor da mistura"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={`mistura-total ${totalOk ? "is-ok" : "is-erro"}`}>
                                    <span className="mistura-total-label">Total</span>
                                    <span className="mistura-total-valor">
                                        {total.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                                        {totalOk ? <FiCheckCircle size={17} /> : <FiAlertCircle size={17} />}
                                    </span>
                                    <span className="mistura-total-dica">A soma das proporções deve ser 100%.</span>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <aside className="mistura-coluna-lateral">
                    <div className="mistura-card">
                        <div className="mistura-card-head">
                            <h2>Pré-visualização da mistura</h2>
                        </div>

                        <div
                            className="mistura-preview-swatch"
                            style={{ background: hexResultado ?? "var(--surface-container-high)" }}
                        >
                            {!hexResultado && <span>Adicione cores para visualizar</span>}
                        </div>

                        <div className="mistura-preview-codigos">
                            <div className="mistura-preview-codigo">
                                <span className="mistura-metric-label">HEX</span>
                                <div className="mistura-codigo-valor">
                                    <strong>{hexResultado ?? "—"}</strong>
                                    {hexResultado && (
                                        <button type="button" onClick={() => copiar(hexResultado, "hex")} aria-label="Copiar HEX">
                                            {copiado === "hex" ? <FiCheck size={15} /> : <FiCopy size={15} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="mistura-preview-codigo">
                                <span className="mistura-metric-label">RGB</span>
                                <div className="mistura-codigo-valor">
                                    <strong>{rgbResultado ?? "—"}</strong>
                                    {rgbResultado && (
                                        <button type="button" onClick={() => copiar(rgbResultado, "rgb")} aria-label="Copiar RGB">
                                            {copiado === "rgb" ? <FiCheck size={15} /> : <FiCopy size={15} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mistura-preview-codigos">
                            <div className="mistura-preview-codigo">
                                <span className="mistura-metric-label">Volume alvo</span>
                                <div className="filtro-menu mistura-volume-menu" ref={volumeMenuRef}>
                                    <button
                                        type="button"
                                        className="filtro-action"
                                        aria-haspopup="menu"
                                        aria-expanded={volumeMenuAberto}
                                        aria-label="Volume alvo da mistura"
                                        onClick={() => setVolumeMenuAberto((aberto) => !aberto)}
                                    >
                                        {formatarMl(volumeMl)}
                                        <FiChevronDown size={15} className="filtro-action-chev" />
                                    </button>
                                    {volumeMenuAberto && (
                                        <div className="filtro-dropdown" role="menu">
                                            {VOLUMES.map((v) => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    role="menuitemradio"
                                                    aria-checked={volumeMl === v}
                                                    className={`filtro-option ${volumeMl === v ? "selected" : ""}`}
                                                    onClick={() => { setVolumeMl(v); setSalvoMsg(""); setVolumeMenuAberto(false); }}
                                                >
                                                    {formatarMl(v)}
                                                    {volumeMl === v && <FiCheck size={15} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mistura-preview-codigo">
                                <span className="mistura-metric-label">Custo estimado</span>
                                <strong className="mistura-custo">{formatarReais(custoEstimado)}</strong>
                            </div>
                        </div>

                        {salvoMsg && <div className="mistura-salvo">{salvoMsg}</div>}

                        <button
                            type="button"
                            className="button btn-novo-pedido mistura-btn-salvar"
                            disabled={!podeSalvar}
                            onClick={handleSalvar}
                        >
                            <FiSave size={16} />
                            {salvando ? "Salvando..." : "Salvar fórmula"}
                        </button>
                    </div>

                    {composicao.length > 0 && (
                        <div className="mistura-card">
                            <div className="mistura-card-head">
                                <h2>Resumo de composição</h2>
                            </div>
                            <div className="mistura-resumo">
                                <div className="mistura-resumo-head">
                                    <span>Cor</span>
                                    <span>Volume (ml)</span>
                                    <span>Custo (R$)</span>
                                </div>
                                {composicao.map(({ linha, cor, volume, custo }) => (
                                    <div key={linha.key} className="mistura-resumo-row">
                                        <span className="mistura-resumo-cor">
                                            <span className="mistura-resumo-swatch" style={{ background: cor.hex }} />
                                            <span className="mistura-resumo-ident">
                                                <strong>{cor.nome}</strong>
                                                <small>{cor.fornecedor}</small>
                                            </span>
                                        </span>
                                        <span>{formatarMl(volume)}</span>
                                        <span>{custo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                                <div className="mistura-resumo-total">
                                    <span>Total</span>
                                    <span>{formatarMl(composicao.reduce((s, i) => s + i.volume, 0))}</span>
                                    <span className="mistura-custo">{formatarReais(custoEstimado)}</span>
                                </div>
                            </div>
                            <p className="mistura-nota">Valores calculados com base no custo por ml de cada cor em estoque.</p>
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}

export default CalculadoraMistura;
