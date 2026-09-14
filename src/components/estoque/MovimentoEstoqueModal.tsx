import { useEffect, useMemo, useRef, useState } from "react";
import { Cancel01Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import {
    EstoqueError,
    MovimentoEstoque,
    SaldoInsumo,
    TipoInsumo,
    getSaldo,
    registrarAjuste,
    registrarEntrada,
} from "../../services/EstoqueService";
import { Material, UNIDADES, UnidadeMedida } from "../../models/Material";
import { Cor } from "../../types";
import { formatNumber } from "../../utils/format";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import IconButton from "../ui/IconButton";
import LoadingButton from "../ui/LoadingButton";
import Select from "../ui/Select";

export type ModoMovimento = "entrada" | "ajuste";

export interface InsumoRef {
    tipoInsumo: TipoInsumo;
    insumoId: string;
}

interface MovimentoEstoqueModalProps {
    modo: ModoMovimento;
    /** Insumo pré-selecionado (ex.: "Entrada" a partir de uma linha em alerta). */
    insumoInicial?: InsumoRef;
    materiais: Material[];
    cores: Cor[];
    onClose: () => void;
    onSalvo: (movimento: MovimentoEstoque) => void;
}

type CampoErro = "insumoId" | "quantidade" | "motivo";
type Erros = Partial<Record<CampoErro, string>>;

const TIPOS_INSUMO: TipoInsumo[] = ["MATERIAL", "COR"];

/** Unidade base (a que o backend guarda): KG conta em G, L em ML. */
function baseDe(unidade: UnidadeMedida): UnidadeMedida {
    if (unidade === "KG") return "G";
    if (unidade === "L") return "ML";
    return unidade;
}

function unidadeValida(valor: string | undefined): UnidadeMedida | null {
    return valor && UNIDADES.includes(valor as UnidadeMedida) ? (valor as UnidadeMedida) : null;
}

function MovimentoEstoqueModal({ modo, insumoInicial, materiais, cores, onClose, onSalvo }: MovimentoEstoqueModalProps) {
    const { t } = useTranslation();
    const ajuste = modo === "ajuste";

    const [tipoInsumo, setTipoInsumo] = useState<TipoInsumo>(insumoInicial?.tipoInsumo ?? "MATERIAL");
    const [insumoId, setInsumoId] = useState(insumoInicial?.insumoId ?? "");
    const [quantidade, setQuantidade] = useState("");
    const [unidadeEscolhida, setUnidadeEscolhida] = useState<UnidadeMedida | "">("");
    const [motivo, setMotivo] = useState("");
    const [saldoAtual, setSaldoAtual] = useState<SaldoInsumo | null>(null);
    const [saldoFalhou, setSaldoFalhou] = useState<InsumoRef | null>(null);
    const [loading, setLoading] = useState(false);
    const [erros, setErros] = useState<Erros>({});
    const [erroEnvio, setErroEnvio] = useState("");

    const quantidadeRef = useRef<HTMLInputElement>(null);
    const motivoRef = useRef<HTMLTextAreaElement>(null);
    const painelRef = useRef<HTMLDivElement>(null);

    useEscapeKey(onClose);
    useBodyScrollLock();
    useFocusTrap(painelRef);

    const opcoesInsumo = useMemo(() => {
        if (tipoInsumo === "MATERIAL") {
            return materiais.filter((m) => m.ativo).map((m) => ({ value: m.id, label: m.nome }));
        }
        return cores.map((c) => ({ value: c.id, label: c.fornecedor ? `${c.nome} · ${c.fornecedor}` : c.nome }));
    }, [tipoInsumo, materiais, cores]);

    // Saldo consultado do insumo em tela (o estado pode guardar o de um insumo anterior).
    const saldoDoInsumo = saldoAtual && saldoAtual.insumoId === insumoId && saldoAtual.tipoInsumo === tipoInsumo ? saldoAtual : null;
    const saldoIndisponivel = !!saldoFalhou && saldoFalhou.insumoId === insumoId && saldoFalhou.tipoInsumo === tipoInsumo;
    const consultandoSaldo = !!insumoId && !saldoDoInsumo && !saldoIndisponivel;

    // Unidade base do insumo escolhido: vem do saldo consultado; enquanto ele
    // não chega, do cadastro (material) ou de ML (cores são sempre em ml).
    const unidadeBase = useMemo<UnidadeMedida | null>(() => {
        if (!insumoId) return null;
        if (saldoDoInsumo) return baseDe(unidadeValida(saldoDoInsumo.unidade) ?? "G");
        if (tipoInsumo === "COR") return "ML";
        const material = materiais.find((m) => m.id === insumoId);
        return baseDe(unidadeValida(material?.unidade) ?? "G");
    }, [insumoId, tipoInsumo, saldoDoInsumo, materiais]);

    /** O backend só aceita unidades da mesma base do insumo (G/KG, ML/L ou UN). */
    const opcoesUnidade = useMemo(
        () => UNIDADES.filter((u) => unidadeBase !== null && baseDe(u) === unidadeBase),
        [unidadeBase],
    );

    // A unidade acompanha a base do insumo: a escolha só vale enquanto for
    // compatível; ao trocar de insumo volta para a base (derivado, sem efeito).
    const unidade: UnidadeMedida | "" =
        unidadeEscolhida && unidadeBase && baseDe(unidadeEscolhida) === unidadeBase ? unidadeEscolhida : unidadeBase ?? "";

    useEffect(() => {
        if (!insumoId) return;
        let ativo = true;
        const alvo: InsumoRef = { tipoInsumo, insumoId };
        getSaldo(tipoInsumo, insumoId)
            .then((saldo) => { if (ativo) setSaldoAtual(saldo); })
            .catch(() => { if (ativo) setSaldoFalhou(alvo); });
        return () => { ativo = false; };
    }, [tipoInsumo, insumoId]);

    function limparErro(campo: CampoErro) {
        setErros((prev) => {
            if (!prev[campo]) return prev;
            const next = { ...prev };
            delete next[campo];
            return next;
        });
    }

    function validar(): Erros {
        const e: Erros = {};
        if (!insumoId) e.insumoId = t("estoque.modal.errorInsumo");
        const qtd = Number(quantidade);
        if (ajuste) {
            if (quantidade.trim() === "" || isNaN(qtd) || qtd === 0) e.quantidade = t("estoque.modal.errorQuantityAdjustment");
        } else if (quantidade.trim() === "" || isNaN(qtd) || qtd <= 0) {
            e.quantidade = t("estoque.modal.errorQuantityEntry");
        }
        if (ajuste && !motivo.trim()) e.motivo = t("estoque.modal.errorReason");
        return e;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        setErroEnvio("");

        const novosErros = validar();
        if (Object.keys(novosErros).length > 0 || !unidade) {
            setErros(novosErros);
            if (novosErros.quantidade) quantidadeRef.current?.focus();
            else if (novosErros.motivo) motivoRef.current?.focus();
            return;
        }

        const data = {
            tipoInsumo,
            insumoId,
            quantidade: Number(quantidade),
            unidade,
            motivo: motivo.trim() || undefined,
        };

        try {
            setLoading(true);
            const movimento = ajuste ? await registrarAjuste(data) : await registrarEntrada(data);
            onSalvo(movimento);
        } catch (err) {
            // 400/422 trazem o motivo da recusa (unidade incompatível, saldo
            // insuficiente com as quantidades); esse texto vai para a tela.
            const detalhado = err instanceof EstoqueError && err.detalhado ? err.message : "";
            setErroEnvio(detalhado || (ajuste ? t("estoque.modal.errorSaveAdjustment") : t("estoque.modal.errorSaveEntry")));
        } finally {
            setLoading(false);
        }
    }

    const unidadeLabel = (u: UnidadeMedida) => t(`materiais.unidadeNome.${u}`);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                ref={painelRef}
                className="modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="estoque-modal-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 id="estoque-modal-titulo">{ajuste ? t("estoque.modal.titleAdjustment") : t("estoque.modal.titleEntry")}</h2>
                    <IconButton variant="modal-close" onClick={onClose} aria-label={t("estoque.modal.close")}>
                        <Cancel01Icon size={18} />
                    </IconButton>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {erroEnvio && <p className="error" role="alert">{erroEnvio}</p>}

                    <div className="input-group">
                        <label htmlFor="estoque-tipo">{t("estoque.modal.typeLabel")}</label>
                        <Select
                            id="estoque-tipo"
                            value={tipoInsumo}
                            onChange={(v) => {
                                setTipoInsumo(v as TipoInsumo);
                                setInsumoId("");
                                limparErro("insumoId");
                            }}
                            options={TIPOS_INSUMO.map((tipo) => ({ value: tipo, label: t(`estoque.tipoInsumo.${tipo}`) }))}
                        />
                        <span className="input-hint" />
                    </div>

                    <div className="input-group">
                        <label htmlFor="estoque-insumo">{t("estoque.modal.insumoLabel")}</label>
                        <Select
                            id="estoque-insumo"
                            value={insumoId}
                            onChange={(v) => { setInsumoId(v); limparErro("insumoId"); }}
                            options={opcoesInsumo}
                            placeholder={opcoesInsumo.length === 0 ? t("estoque.modal.insumoEmpty") : t("estoque.modal.insumoPlaceholder")}
                            disabled={opcoesInsumo.length === 0}
                            invalid={!!erros.insumoId}
                            describedBy={erros.insumoId ? "estoque-insumo-erro" : undefined}
                        />
                        <span className="input-hint" id="estoque-insumo-erro">
                            {erros.insumoId && <span className="error-text">{erros.insumoId}</span>}
                        </span>
                    </div>

                    {insumoId && (
                        <div className="material-saldo-info" role="status" aria-live="polite">
                            <span className="material-saldo-label">{t("estoque.modal.currentStock")}</span>
                            <strong className="material-saldo-valor">
                                {consultandoSaldo
                                    ? t("estoque.modal.currentStockLoading")
                                    : saldoDoInsumo
                                        ? `${formatNumber(saldoDoInsumo.saldo)} ${t(`materiais.unidade.${unidadeValida(saldoDoInsumo.unidade) ?? "G"}`)}`
                                        : t("estoque.modal.currentStockUnavailable")}
                            </strong>
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="estoque-quantidade">{t("estoque.modal.quantityLabel")}</label>
                        <input
                            id="estoque-quantidade"
                            ref={quantidadeRef}
                            type="number"
                            step="any"
                            min={ajuste ? undefined : "0"}
                            className={erros.quantidade ? "input-error" : ""}
                            value={quantidade}
                            onChange={(e) => { setQuantidade(e.target.value); limparErro("quantidade"); }}
                            placeholder={ajuste ? t("estoque.modal.quantityPlaceholderAdjustment") : t("estoque.modal.quantityPlaceholderEntry")}
                            aria-invalid={!!erros.quantidade}
                            aria-describedby="estoque-quantidade-hint"
                        />
                        <span className="input-hint" id="estoque-quantidade-hint">
                            {erros.quantidade
                                ? <span className="error-text">{erros.quantidade}</span>
                                : ajuste ? t("estoque.modal.quantityHintAdjustment") : t("estoque.modal.quantityHintEntry")}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="estoque-unidade">{t("estoque.modal.unitLabel")}</label>
                        <Select
                            id="estoque-unidade"
                            value={unidade}
                            onChange={(v) => setUnidadeEscolhida(v as UnidadeMedida)}
                            options={opcoesUnidade.map((u) => ({ value: u, label: unidadeLabel(u) }))}
                            placeholder={t("estoque.modal.unitPlaceholder")}
                            disabled={!insumoId}
                        />
                        <span className="input-hint">
                            {unidadeBase ? t("estoque.modal.unitHint", { base: t(`materiais.unidade.${unidadeBase}`) }) : ""}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="estoque-motivo">{ajuste ? t("estoque.modal.reasonLabel") : t("estoque.modal.reasonLabelOptional")}</label>
                        <textarea
                            id="estoque-motivo"
                            ref={motivoRef}
                            rows={2}
                            className={erros.motivo ? "input-error" : ""}
                            value={motivo}
                            onChange={(e) => { setMotivo(e.target.value); limparErro("motivo"); }}
                            placeholder={ajuste ? t("estoque.modal.reasonPlaceholderAdjustment") : t("estoque.modal.reasonPlaceholderEntry")}
                            aria-invalid={!!erros.motivo}
                            aria-describedby={erros.motivo ? "estoque-motivo-erro" : undefined}
                        />
                        <span className="input-hint" id="estoque-motivo-erro">
                            {erros.motivo && <span className="error-text">{erros.motivo}</span>}
                        </span>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            {t("estoque.modal.cancel")}
                        </button>
                        <LoadingButton pending={loading} pendingLabel={t("estoque.modal.submitting")}>
                            {ajuste ? t("estoque.modal.submitAdjustment") : t("estoque.modal.submitEntry")}
                        </LoadingButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MovimentoEstoqueModal;
