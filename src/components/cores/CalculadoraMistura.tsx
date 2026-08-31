import { useEffect, useMemo, useRef, useState } from "react";
import { Add01Icon, AlertCircleIcon, ArrowDown01Icon, CheckmarkCircle02Icon, Copy01Icon, Delete02Icon, DropletIcon, FloppyDiskIcon, RotateLeft01Icon, Tick02Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { getCores } from "../../services/CorService";
import { criarMistura } from "../../services/MisturaService";
import { getCached, setCached } from "../../services/cache";
import { Cor } from "../../types";
import Select from "../ui/Select";
import { cn } from "../../utils/cn";
import { formatCurrency, formatNumber } from "../../utils/format";
import { useDismissable } from "../../hooks/useDismissable";

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

let proximaKey = 1;

function CalculadoraMistura() {
    const { t } = useTranslation();
    const fmtMl = (valor: number) => t("cores.mistura.mlValue", { value: formatNumber(valor) });
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

    useDismissable({
        enabled: volumeMenuAberto,
        refs: volumeMenuRef,
        onDismiss: () => setVolumeMenuAberto(false),
    });

    useEffect(() => {
        getCores()
            .then((data) => {
                setCores(data);
                setCached(CACHE_KEY, data);
            })
            .catch(() => setErro(t("cores.mistura.errorLoad")));
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
            setErro(t("cores.mistura.copyError"));
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
            setSalvoMsg(t("cores.mistura.saved"));
        } catch (e) {
            setErro(e instanceof Error && e.message ? e.message : t("cores.mistura.saveError"));
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className="dashboard-main pedidos-page">
            <header className="pedidos-toolbar">
                <div>
                    <h1 className="dashboard-title">{t("cores.mistura.title")}</h1>
                    <p className="dashboard-subtitle">{t("cores.mistura.subtitle")}</p>
                </div>
            </header>

            {erro && <div className="dashboard-error">{erro}</div>}

            <div className="mistura-layout">
                <section className="mistura-coluna-principal">
                    <div className="mistura-campo-nome">
                        <label htmlFor="nome-formula">{t("cores.mistura.nameLabel")}</label>
                        <div className="mistura-nome-wrap">
                            <input
                                id="nome-formula"
                                type="text"
                                placeholder={t("cores.mistura.namePlaceholder")}
                                maxLength={NOME_MAX}
                                value={nome}
                                onChange={(e) => { setNome(e.target.value); setSalvoMsg(""); }}
                            />
                            <span className="mistura-nome-contador">{nome.length}/{NOME_MAX}</span>
                        </div>
                    </div>

                    <div className="mistura-card">
                        <div className="mistura-card-head">
                            <h2>{t("cores.mistura.selectedColors")}</h2>
                            <div className="mistura-card-acoes">
                                {linhas.length > 0 && (
                                    <button type="button" className="btn-secondary mistura-btn-limpar" onClick={limparTudo}>
                                        <RotateLeft01Icon size={15} />
                                        {t("cores.mistura.clearAll")}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="button btn-novo-pedido mistura-btn-add"
                                    onClick={adicionarLinha}
                                    disabled={cores.length === 0 || linhas.length >= cores.length}
                                >
                                    <Add01Icon size={16} />
                                    {t("cores.mistura.addColor")}
                                </button>
                            </div>
                        </div>

                        {linhas.length === 0 ? (
                            <div className="pedidos-empty mistura-empty">
                                <span className="pedidos-empty-icon"><DropletIcon size={28} /></span>
                                <p className="empty-title">{t("cores.mistura.emptyTitle")}</p>
                                <p className="empty-sub">
                                    {cores.length === 0
                                        ? t("cores.mistura.emptyNoColors")
                                        : t("cores.mistura.emptyHint")}
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
                                                        <Select
                                                            value={linha.corId}
                                                            onChange={(v) => atualizarLinha(linha.key, { corId: v })}
                                                            ariaLabel={t("cores.mistura.colorSelectAria")}
                                                            placeholder={t("cores.mistura.colorSelectPlaceholder")}
                                                            options={cores
                                                                .filter((c) => c.id === linha.corId || !usadas.has(c.id))
                                                                .map((c) => ({ value: c.id, label: c.nome }))}
                                                        />
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
                                                        aria-label={t("cores.mistura.proportionAria")}
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
                                                        aria-label={t("cores.mistura.sliderAria")}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="mistura-linha-remover"
                                                    onClick={() => removerLinha(linha.key)}
                                                    aria-label={t("cores.mistura.removeAria")}
                                                >
                                                    <Delete02Icon size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={cn("mistura-total", totalOk ? "is-ok" : "is-erro")}>
                                    <span className="mistura-total-label">{t("cores.mistura.totalLabel")}</span>
                                    <span className="mistura-total-valor">
                                        {formatNumber(total, { maximumFractionDigits: 1 })}%
                                        {totalOk ? <CheckmarkCircle02Icon size={17} /> : <AlertCircleIcon size={17} />}
                                    </span>
                                    <span className="mistura-total-dica">{t("cores.mistura.totalHint")}</span>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <aside className="mistura-coluna-lateral">
                    <div className="mistura-card">
                        <div className="mistura-card-head">
                            <h2>{t("cores.mistura.previewTitle")}</h2>
                        </div>

                        <div
                            className="mistura-preview-swatch"
                            style={{ background: hexResultado ?? "var(--surface-container-high)" }}
                        >
                            {!hexResultado && <span>{t("cores.mistura.previewEmpty")}</span>}
                        </div>

                        <div className="mistura-preview-codigos">
                            <div className="mistura-preview-codigo">
                                <span className="mistura-metric-label">HEX</span>
                                <div className="mistura-codigo-valor">
                                    <strong>{hexResultado ?? "—"}</strong>
                                    {hexResultado && (
                                        <button type="button" onClick={() => copiar(hexResultado, "hex")} aria-label={t("cores.mistura.copyHexAria")}>
                                            {copiado === "hex" ? <Tick02Icon size={15} /> : <Copy01Icon size={15} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="mistura-preview-codigo">
                                <span className="mistura-metric-label">RGB</span>
                                <div className="mistura-codigo-valor">
                                    <strong>{rgbResultado ?? "—"}</strong>
                                    {rgbResultado && (
                                        <button type="button" onClick={() => copiar(rgbResultado, "rgb")} aria-label={t("cores.mistura.copyRgbAria")}>
                                            {copiado === "rgb" ? <Tick02Icon size={15} /> : <Copy01Icon size={15} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mistura-preview-codigos">
                            <div className="mistura-preview-codigo">
                                <span className="mistura-metric-label">{t("cores.mistura.targetVolume")}</span>
                                <div className="filtro-menu mistura-volume-menu" ref={volumeMenuRef}>
                                    <button
                                        type="button"
                                        className="filtro-action"
                                        aria-haspopup="menu"
                                        aria-expanded={volumeMenuAberto}
                                        aria-label={t("cores.mistura.targetVolumeAria")}
                                        onClick={() => setVolumeMenuAberto((aberto) => !aberto)}
                                    >
                                        {fmtMl(volumeMl)}
                                        <ArrowDown01Icon size={15} className="filtro-action-chev" />
                                    </button>
                                    {volumeMenuAberto && (
                                        <div className="filtro-dropdown" role="menu">
                                            {VOLUMES.map((v) => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    role="menuitemradio"
                                                    aria-checked={volumeMl === v}
                                                    className={cn("filtro-option", volumeMl === v && "selected")}
                                                    onClick={() => { setVolumeMl(v); setSalvoMsg(""); setVolumeMenuAberto(false); }}
                                                >
                                                    {fmtMl(v)}
                                                    {volumeMl === v && <Tick02Icon size={15} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mistura-preview-codigo">
                                <span className="mistura-metric-label">{t("cores.mistura.estimatedCost")}</span>
                                <strong className="mistura-custo">{formatCurrency(custoEstimado)}</strong>
                            </div>
                        </div>

                        {salvoMsg && <div className="mistura-salvo">{salvoMsg}</div>}

                        <button
                            type="button"
                            className="button btn-novo-pedido mistura-btn-salvar"
                            disabled={!podeSalvar}
                            onClick={handleSalvar}
                        >
                            <FloppyDiskIcon size={16} />
                            {salvando ? t("cores.mistura.saving") : t("cores.mistura.save")}
                        </button>
                    </div>

                    {composicao.length > 0 && (
                        <div className="mistura-card">
                            <div className="mistura-card-head">
                                <h2>{t("cores.mistura.summaryTitle")}</h2>
                            </div>
                            <div className="mistura-resumo">
                                <div className="mistura-resumo-head">
                                    <span>{t("cores.mistura.sumColor")}</span>
                                    <span>{t("cores.mistura.sumVolume")}</span>
                                    <span>{t("cores.mistura.sumCost")}</span>
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
                                        <span>{fmtMl(volume)}</span>
                                        <span>{formatNumber(custo, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                                <div className="mistura-resumo-total">
                                    <span>{t("cores.mistura.sumTotal")}</span>
                                    <span>{fmtMl(composicao.reduce((s, i) => s + i.volume, 0))}</span>
                                    <span className="mistura-custo">{formatCurrency(custoEstimado)}</span>
                                </div>
                            </div>
                            <p className="mistura-nota">{t("cores.mistura.note")}</p>
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}

export default CalculadoraMistura;
