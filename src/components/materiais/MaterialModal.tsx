import { useRef, useState } from "react";
import { Cancel01Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { criarMaterial, editarMaterial } from "../../services/MaterialService";
import { Material } from "../../models/Material";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import IconButton from "../ui/IconButton";
import LoadingButton from "../ui/LoadingButton";

interface MaterialModalProps {
    material?: Material;
    onClose: () => void;
    onSalvo: () => void;
}

type CampoErro = "nome" | "tipo" | "densidadeGcm3" | "precoPorGrama";
type Erros = Partial<Record<CampoErro, string>>;

function MaterialModal({ material, onClose, onSalvo }: MaterialModalProps) {
    const { t } = useTranslation();
    const editando = !!material;

    const [nome, setNome] = useState(material?.nome ?? "");
    const [tipo, setTipo] = useState(material?.tipo ?? "");
    const [densidade, setDensidade] = useState(material ? String(material.densidadeGcm3) : "");
    const [preco, setPreco] = useState(material ? String(material.precoPorGrama) : "");
    const [ativo, setAtivo] = useState(material?.ativo ?? true);
    const [loading, setLoading] = useState(false);
    const [erros, setErros] = useState<Erros>({});
    const [erroEnvio, setErroEnvio] = useState("");

    const nomeRef = useRef<HTMLInputElement>(null);
    const tipoRef = useRef<HTMLInputElement>(null);
    const densidadeRef = useRef<HTMLInputElement>(null);
    const precoRef = useRef<HTMLInputElement>(null);
    const painelRef = useRef<HTMLDivElement>(null);

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

    function validar(): Erros {
        const e: Erros = {};
        if (!nome.trim()) e.nome = t("materiais.modal.errorName");
        if (!tipo.trim()) e.tipo = t("materiais.modal.errorType");
        const dens = Number(densidade);
        if (!densidade || isNaN(dens) || dens <= 0) e.densidadeGcm3 = t("materiais.modal.errorDensity");
        const prc = Number(preco);
        if (!preco || isNaN(prc) || prc < 0) e.precoPorGrama = t("materiais.modal.errorPrice");
        return e;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        setErroEnvio("");

        const novosErros = validar();
        if (Object.keys(novosErros).length > 0) {
            setErros(novosErros);
            if (novosErros.nome) nomeRef.current?.focus();
            else if (novosErros.tipo) tipoRef.current?.focus();
            else if (novosErros.densidadeGcm3) densidadeRef.current?.focus();
            else if (novosErros.precoPorGrama) precoRef.current?.focus();
            return;
        }

        const data = {
            nome: nome.trim(),
            tipo: tipo.trim(),
            densidadeGcm3: Number(densidade),
            precoPorGrama: Number(preco),
            ativo: editando ? ativo : true,
        };

        try {
            setLoading(true);
            if (editando) {
                await editarMaterial(material!.id, data);
            } else {
                await criarMaterial(data);
            }
            onSalvo();
        } catch {
            setErroEnvio(editando ? t("materiais.modal.errorSaveEdit") : t("materiais.modal.errorSaveNew"));
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
                aria-labelledby="modal-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 id="modal-titulo">{editando ? t("materiais.modal.titleEdit") : t("materiais.modal.titleNew")}</h2>
                    <IconButton variant="modal-close" onClick={onClose} aria-label={t("materiais.modal.close")}>
                        <Cancel01Icon size={18} />
                    </IconButton>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {erroEnvio && <p className="error">{erroEnvio}</p>}

                    <div className="input-group">
                        <label htmlFor="nome">{t("materiais.modal.nameLabel")}</label>
                        <input
                            id="nome"
                            ref={nomeRef}
                            className={erros.nome ? "input-error" : ""}
                            value={nome}
                            onChange={(e) => { setNome(e.target.value); limparErro("nome"); }}
                            placeholder={t("materiais.modal.namePlaceholder")}
                            aria-invalid={!!erros.nome}
                            aria-describedby={erros.nome ? "nome-erro" : undefined}
                            autoFocus
                        />
                        <span className="input-hint" id="nome-erro">
                            {erros.nome && <span className="error-text">{erros.nome}</span>}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="tipo">{t("materiais.modal.typeLabel")}</label>
                        <input
                            id="tipo"
                            ref={tipoRef}
                            className={erros.tipo ? "input-error" : ""}
                            value={tipo}
                            onChange={(e) => { setTipo(e.target.value); limparErro("tipo"); }}
                            placeholder={t("materiais.modal.typePlaceholder")}
                            aria-invalid={!!erros.tipo}
                            aria-describedby={erros.tipo ? "tipo-erro" : undefined}
                        />
                        <span className="input-hint" id="tipo-erro">
                            {erros.tipo && <span className="error-text">{erros.tipo}</span>}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="densidade">{t("materiais.modal.densityLabel")}</label>
                        <input
                            id="densidade"
                            ref={densidadeRef}
                            type="number"
                            step="0.01"
                            min="0.01"
                            className={erros.densidadeGcm3 ? "input-error" : ""}
                            value={densidade}
                            onChange={(e) => { setDensidade(e.target.value); limparErro("densidadeGcm3"); }}
                            placeholder={t("materiais.modal.densityPlaceholder")}
                            aria-invalid={!!erros.densidadeGcm3}
                            aria-describedby={erros.densidadeGcm3 ? "densidade-erro" : undefined}
                        />
                        <span className="input-hint" id="densidade-erro">
                            {erros.densidadeGcm3 && <span className="error-text">{erros.densidadeGcm3}</span>}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="preco">{t("materiais.modal.priceLabel")}</label>
                        <input
                            id="preco"
                            ref={precoRef}
                            type="number"
                            step="0.001"
                            min="0"
                            className={erros.precoPorGrama ? "input-error" : ""}
                            value={preco}
                            onChange={(e) => { setPreco(e.target.value); limparErro("precoPorGrama"); }}
                            placeholder={t("materiais.modal.pricePlaceholder")}
                            aria-invalid={!!erros.precoPorGrama}
                            aria-describedby={erros.precoPorGrama ? "preco-erro" : undefined}
                        />
                        <span className="input-hint" id="preco-erro">
                            {erros.precoPorGrama && <span className="error-text">{erros.precoPorGrama}</span>}
                        </span>
                    </div>

                    {editando && (
                        <div className="input-group">
                            <label className="material-check">
                                <input
                                    type="checkbox"
                                    checked={ativo}
                                    onChange={(e) => setAtivo(e.target.checked)}
                                />
                                <span>{t("materiais.modal.active")}</span>
                            </label>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            {t("materiais.modal.cancel")}
                        </button>
                        <LoadingButton pending={loading} pendingLabel={editando ? t("materiais.modal.saving") : t("materiais.modal.creating")}>
                            {editando ? t("materiais.modal.save") : t("materiais.modal.create")}
                        </LoadingButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MaterialModal;
