import { useRef, useState } from "react";
import { Cancel01Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { criarCor, editarCor, CorInput } from "../../services/CorService";
import { Cor, Acabamento } from "../../types";
import Select from "../ui/Select";
import { cn } from "../../utils/cn";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import IconButton from "../ui/IconButton";
import LoadingButton from "../ui/LoadingButton";

interface NovaCorModalProps {
    onClose: () => void;
    onSalvo: () => void;
    cor?: Cor;
}

type CampoErro = "nome" | "fornecedor" | "estoqueMl" | "custoMl" | "hex";
type Erros = Partial<Record<CampoErro, string>>;

const ACABAMENTOS: Acabamento[] = ["FOSCO", "BRILHANTE", "METALICO", "CETIM"];

const HEX_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

const CORES_PRESET = [
    "#FB4A14", "#E63946", "#F4A261", "#E9C46A", "#2A9D8F",
    "#264653", "#1D3557", "#6D597A", "#000000", "#FFFFFF",
];

function isHexValido(valor: string): boolean {
    return HEX_REGEX.test(valor);
}

function normalizarHex(valor: string): string {
    const v = valor.trim();
    if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
        return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toUpperCase();
    }
    return v.toUpperCase();
}

function NovaCorModal({ onClose, onSalvo, cor }: NovaCorModalProps) {
    const { t } = useTranslation();
    const editando = !!cor;

    const [nome, setNome] = useState(cor?.nome ?? "");
    const [fornecedor, setFornecedor] = useState(cor?.fornecedor ?? "");
    const [codigo, setCodigo] = useState(cor?.codigo ?? "");
    const [hex, setHex] = useState(cor?.hex ?? "#FB4A14");
    const [acabamento, setAcabamento] = useState<Acabamento>(cor?.acabamento ?? "FOSCO");
    const [estoqueMl, setEstoqueMl] = useState(cor ? String(cor.estoqueMl) : "");
    const [estoqueMinimoMl, setEstoqueMinimoMl] = useState(cor ? String(cor.estoqueMinimoMl) : "500");
    const [custoMl, setCustoMl] = useState(cor ? String(cor.custoMl) : "");
    const [loading, setLoading] = useState(false);
    const [erros, setErros] = useState<Erros>({});
    const [erroEnvio, setErroEnvio] = useState("");

    const nomeRef = useRef<HTMLInputElement>(null);
    const fornecedorRef = useRef<HTMLInputElement>(null);
    const estoqueRef = useRef<HTMLInputElement>(null);
    const custoRef = useRef<HTMLInputElement>(null);
    const hexRef = useRef<HTMLInputElement>(null);
    const painelRef = useRef<HTMLDivElement>(null);

    const hexSeguro = isHexValido(hex) ? normalizarHex(hex) : "#FB4A14";

    useEscapeKey(onClose);
    useBodyScrollLock();
    useFocusTrap(painelRef);

    function limparErro(campo: CampoErro) {
        setErros((prev) => {
            if (!prev[campo]) return prev;
            const next = { ...prev };
            delete next[campo];
            return next;
        });
    }

    function handleHexChange(valor: string) {
        const limpo = "#" + valor.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 6);
        setHex(limpo);
        limparErro("hex");
    }

    function selecionarCor(valor: string) {
        setHex(valor.toUpperCase());
        limparErro("hex");
    }

    function validar(): Erros {
        const e: Erros = {};
        if (!nome.trim()) e.nome = t("cores.modal.errorName");
        if (!isHexValido(hex)) e.hex = t("cores.modal.errorHex");
        if (!fornecedor.trim()) e.fornecedor = t("cores.modal.errorSupplier");
        if (estoqueMl === "" || Number(estoqueMl) < 0) e.estoqueMl = t("cores.modal.errorStock");
        if (custoMl === "" || Number(custoMl) < 0) e.custoMl = t("cores.modal.errorCost");
        return e;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        setErroEnvio("");

        const novosErros = validar();
        if (Object.keys(novosErros).length > 0) {
            setErros(novosErros);
            if (novosErros.nome) nomeRef.current?.focus();
            else if (novosErros.hex) hexRef.current?.focus();
            else if (novosErros.fornecedor) fornecedorRef.current?.focus();
            else if (novosErros.estoqueMl) estoqueRef.current?.focus();
            else if (novosErros.custoMl) custoRef.current?.focus();
            return;
        }

        const data: CorInput = {
            nome: nome.trim(),
            fornecedor: fornecedor.trim(),
            codigo: codigo.trim() || undefined,
            hex: normalizarHex(hex),
            acabamento,
            estoqueMl: Number(estoqueMl),
            estoqueMinimoMl: Number(estoqueMinimoMl) || 0,
            custoMl: Number(custoMl),
        };

        try {
            setLoading(true);
            if (editando) {
                await editarCor(cor!.id, data);
            } else {
                await criarCor(data);
            }
            onSalvo();
        } catch {
            setErroEnvio(editando ? t("cores.modal.errorSaveEdit") : t("cores.modal.errorSaveNew"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                ref={painelRef}
                className="modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cor-modal-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 id="cor-modal-titulo">{editando ? t("cores.modal.titleEdit") : t("cores.modal.titleNew")}</h2>
                    <IconButton variant="modal-close" onClick={onClose} aria-label={t("cores.modal.close")}>
                        <Cancel01Icon size={18} />
                    </IconButton>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {erroEnvio && <p className="error">{erroEnvio}</p>}

                    <div className="cor-modal-topo">
                        <div className="cor-modal-swatch-wrap" title={t("cores.modal.chooseColorTitle")}>
                            <span className="cor-modal-swatch" style={{ background: hexSeguro }} aria-hidden="true" />
                            <span className="cor-modal-swatch-hint">{t("cores.modal.choose")}</span>
                            <input
                                type="color"
                                className="cor-modal-color-input"
                                value={hexSeguro.toLowerCase()}
                                onChange={(e) => selecionarCor(e.target.value)}
                                aria-label={t("cores.modal.colorWheelAria")}
                            />
                        </div>
                        <div className="input-group cor-modal-hex">
                            <label htmlFor="hex">{t("cores.modal.hexLabel")}</label>
                            <input
                                id="hex"
                                ref={hexRef}
                                className={erros.hex ? "input-error" : ""}
                                value={hex}
                                onChange={(e) => handleHexChange(e.target.value)}
                                placeholder="#FB4A14"
                                maxLength={7}
                                spellCheck={false}
                                aria-invalid={!!erros.hex}
                            />
                            <span className="input-hint">
                                {erros.hex && <span className="error-text">{erros.hex}</span>}
                            </span>
                        </div>
                    </div>

                    <div className="cor-presets" role="group" aria-label={t("cores.modal.presetsAria")}>
                        {CORES_PRESET.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={cn("cor-preset", hexSeguro === c && "is-active")}
                                style={{ background: c }}
                                onClick={() => selecionarCor(c)}
                                aria-label={t("cores.modal.presetAria", { color: c })}
                            />
                        ))}
                    </div>

                    <div className="input-group">
                        <label htmlFor="nome">{t("cores.modal.nameLabel")}</label>
                        <input
                            id="nome"
                            ref={nomeRef}
                            className={erros.nome ? "input-error" : ""}
                            value={nome}
                            onChange={(e) => { setNome(e.target.value); limparErro("nome"); }}
                            placeholder={t("cores.modal.namePlaceholder")}
                            aria-invalid={!!erros.nome}
                            autoFocus
                        />
                        <span className="input-hint">
                            {erros.nome && <span className="error-text">{erros.nome}</span>}
                        </span>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="fornecedor">{t("cores.modal.supplierLabel")}</label>
                            <input
                                id="fornecedor"
                                ref={fornecedorRef}
                                className={erros.fornecedor ? "input-error" : ""}
                                value={fornecedor}
                                onChange={(e) => { setFornecedor(e.target.value); limparErro("fornecedor"); }}
                                placeholder={t("cores.modal.supplierPlaceholder")}
                                aria-invalid={!!erros.fornecedor}
                            />
                            <span className="input-hint">
                                {erros.fornecedor && <span className="error-text">{erros.fornecedor}</span>}
                            </span>
                        </div>

                        <div className="input-group">
                            <label htmlFor="codigo">
                                {t("cores.modal.codeLabel")} <span className="label-opcional">{t("cores.modal.optional")}</span>
                            </label>
                            <input
                                id="codigo"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value)}
                                placeholder={t("cores.modal.codePlaceholder")}
                            />
                            <span className="input-hint" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="acabamento">{t("cores.modal.finishLabel")}</label>
                        <Select
                            id="acabamento"
                            value={acabamento}
                            onChange={(v) => setAcabamento(v as Acabamento)}
                            options={ACABAMENTOS.map((a) => ({ value: a, label: t(`cores.acabamento.${a}`) }))}
                        />
                        <span className="input-hint" />
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="estoque">{t("cores.modal.stockLabel")}</label>
                            <input
                                id="estoque"
                                ref={estoqueRef}
                                type="number"
                                min={0}
                                className={erros.estoqueMl ? "input-error" : ""}
                                value={estoqueMl}
                                onChange={(e) => { setEstoqueMl(e.target.value); limparErro("estoqueMl"); }}
                                placeholder="0"
                                aria-invalid={!!erros.estoqueMl}
                            />
                            <span className="input-hint">
                                {erros.estoqueMl && <span className="error-text">{erros.estoqueMl}</span>}
                            </span>
                        </div>

                        <div className="input-group">
                            <label htmlFor="estoqueMin">{t("cores.modal.stockMinLabel")}</label>
                            <input
                                id="estoqueMin"
                                type="number"
                                min={0}
                                value={estoqueMinimoMl}
                                onChange={(e) => setEstoqueMinimoMl(e.target.value)}
                                placeholder="500"
                            />
                            <span className="input-hint" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="custo">{t("cores.modal.costLabel")}</label>
                        <input
                            id="custo"
                            ref={custoRef}
                            type="number"
                            min={0}
                            step="0.01"
                            className={erros.custoMl ? "input-error" : ""}
                            value={custoMl}
                            onChange={(e) => { setCustoMl(e.target.value); limparErro("custoMl"); }}
                            placeholder="0,00"
                            aria-invalid={!!erros.custoMl}
                        />
                        <span className="input-hint">
                            {erros.custoMl && <span className="error-text">{erros.custoMl}</span>}
                        </span>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            {t("cores.modal.cancel")}
                        </button>
                        <LoadingButton pending={loading} pendingLabel={editando ? t("cores.modal.saving") : t("cores.modal.creating")}>
                            {editando ? t("cores.modal.save") : t("cores.modal.create")}
                        </LoadingButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NovaCorModal;
