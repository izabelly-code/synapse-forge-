import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Add01Icon, Calendar03Icon, Cancel01Icon, CubeIcon, Delete02Icon, Download01Icon, File01Icon, Image02Icon, PencilEdit02Icon, UserIcon } from "hugeicons-react";

import {
    baixarObjeto3D,
    editarPedido,
    getPedido,
    gerarOrdemServico
} from "../../services/PedidoService";

import { useTranslation } from "react-i18next";
import { Pedido, PedidoStatus } from "../../types";
import Select from "../ui/Select";
import ImageLightbox from "../ui/ImageLightbox";
import { formatDate } from "../../utils/format";
import { cn } from "../../utils/cn";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

const STATUS_OPTIONS: PedidoStatus[] = ["MODELAGEM", "IMPRESSAO", "PINTURA", "ACABAMENTO", "FINALIZADO"];

function formatPrazoLongo(iso: string): string {
    const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return formatDate(date, { day: "2-digit", month: "long", year: "numeric" });
}

interface PedidoDetalheModalProps {
    pedidoId: string;
    onClose: () => void;
    onUpdated?: (pedido: Pedido) => void;
    abrirEmEdicao?: boolean;
}

interface NovaImagem {
    id: string;
    arquivo: File;
    url: string;
}

type CampoErro = "cliente" | "projeto" | "prazo";
type Erros = Partial<Record<CampoErro, string>>;

function PedidoDetalheModal({ pedidoId, onClose, onUpdated, abrirEmEdicao = false }: PedidoDetalheModalProps) {
    const { t } = useTranslation();
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editando, setEditando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erroEdicao, setErroEdicao] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");
    const [zoomSrc, setZoomSrc] = useState<string | null>(null);

    const [cliente, setCliente] = useState("");
    const [projeto, setProjeto] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prazo, setPrazo] = useState("");
    const [status, setStatus] = useState<PedidoStatus>("MODELAGEM");
    const [objeto3D, setObjeto3D] = useState<File | null>(null);
    const [removerObjeto3D, setRemoverObjeto3D] = useState(false);
    const [novasImagens, setNovasImagens] = useState<NovaImagem[]>([]);
    const [imagensRemover, setImagensRemover] = useState<Set<string>>(new Set());
    const [erros, setErros] = useState<Erros>({});
    const novasImagensRef = useRef<NovaImagem[]>([]);

    const clienteRef = useRef<HTMLInputElement>(null);
    const projetoRef = useRef<HTMLInputElement>(null);
    const prazoRef = useRef<HTMLInputElement>(null);

    const atualizarNovasImagens = useCallback((proximas: NovaImagem[]) => {
        novasImagensRef.current = proximas;
        setNovasImagens(proximas);
    }, []);

    const limparNovasImagens = useCallback(() => {
        novasImagensRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
        atualizarNovasImagens([]);
    }, [atualizarNovasImagens]);

    const iniciarEdicao = useCallback((alvo: Pedido) => {
        setCliente(alvo.cliente);
        setProjeto(alvo.projeto);
        setDescricao(alvo.descricao ?? "");
        setPrazo(alvo.prazo.slice(0, 10));
        setStatus(alvo.status);
        setObjeto3D(null);
        setRemoverObjeto3D(false);
        limparNovasImagens();
        setImagensRemover(new Set());
        setErroEdicao("");
        setErros({});
        setEditando(true);
    }, [limparNovasImagens]);

    useEffect(() => {
        let active = true;

        async function fetchPedido() {
            setLoading(true);
            setError("");
            try {
                const data = await getPedido(pedidoId);
                if (active) {
                    setPedido(data);
                    if (abrirEmEdicao) iniciarEdicao(data);
                }
            } catch {
                if (active) setError(t("pedidos.detalhe.errorLoad"));
            } finally {
                if (active) setLoading(false);
            }
        }

        fetchPedido();
        return () => { active = false; };
    }, [pedidoId, abrirEmEdicao, iniciarEdicao, t]);

    useEscapeKey(() => {
        if (editando) {
            setEditando(false);
            setErroEdicao("");
        } else {
            onClose();
        }
    });
    useBodyScrollLock();

    const imagensAtuais = useMemo(() => {
        const fontes = pedido?.imagensReferenciaFileIds ?? [];
        const ids = pedido?.imagensReferenciaIds ?? [];
        return fontes.map((src, index) => ({ src, id: ids[index] ?? "" })).filter((imagem) => imagem.src);
    }, [pedido]);

    useEffect(() => {
        return () => {
            novasImagensRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
        };
    }, []);

    function adicionarImagens(files: FileList | null) {
        if (!files?.length) return;

        const chaves = new Set(novasImagensRef.current.map(({ arquivo }) => `${arquivo.name}-${arquivo.size}`));
        const selecionadas = Array.from(files)
            .filter((arquivo) => arquivo.type.startsWith("image/"))
            .filter((arquivo) => !chaves.has(`${arquivo.name}-${arquivo.size}`))
            .map((arquivo) => ({
                id: `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}-${crypto.randomUUID()}`,
                arquivo,
                url: URL.createObjectURL(arquivo),
            }));

        atualizarNovasImagens([...novasImagensRef.current, ...selecionadas]);
    }

    function retirarNovaImagem(id: string) {
        const removida = novasImagensRef.current.find((imagem) => imagem.id === id);
        if (removida) URL.revokeObjectURL(removida.url);
        atualizarNovasImagens(novasImagensRef.current.filter((imagem) => imagem.id !== id));
    }

    function cancelarEdicao() {
        setEditando(false);
        setErroEdicao("");
        setErros({});
        setObjeto3D(null);
        limparNovasImagens();
        setImagensRemover(new Set());
    }

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
        if (!cliente.trim()) e.cliente = t("pedidos.form.errorClient");
        if (!projeto.trim()) e.projeto = t("pedidos.form.errorProject");
        if (!prazo) e.prazo = t("pedidos.form.errorDeadline");
        return e;
    }

    function alternarRemocaoImagem(id: string) {
        if (!id) return;
        setImagensRemover((atuais) => {
            const proximas = new Set(atuais);
            if (proximas.has(id)) proximas.delete(id);
            else proximas.add(id);
            return proximas;
        });
    }

    async function handleSalvar(e: React.FormEvent) {
        e.preventDefault();
        if (!pedido) return;

        const novosErros = validar();
        if (Object.keys(novosErros).length > 0) {
            setErros(novosErros);
            if (novosErros.cliente) clienteRef.current?.focus();
            else if (novosErros.projeto) projetoRef.current?.focus();
            else if (novosErros.prazo) prazoRef.current?.focus();
            return;
        }

        setSalvando(true);
        setErroEdicao("");
        try {
            const atualizado = await editarPedido(pedido.id, {
                cliente: cliente.trim(),
                projeto: projeto.trim(),
                descricao: descricao.trim(),
                prazo,
                status,
                objeto3D,
                removerObjeto3D,
                imagensReferencia: novasImagens.map(({ arquivo }) => arquivo),
                imagensRemover: Array.from(imagensRemover),
            });
            setPedido(atualizado);
            setEditando(false);
            setObjeto3D(null);
            limparNovasImagens();
            setImagensRemover(new Set());
            onUpdated?.(atualizado);
        } catch {
            setErroEdicao(t("pedidos.detalhe.errorSave"));
        } finally {
            setSalvando(false);
        }
    }

    async function handleDownloadObjeto3D() {
        if (!pedido?.objeto3DFileId || downloading) return;
        setDownloading(true);
        setDownloadError("");
        try {
            await baixarObjeto3D(pedido.id);
        } catch (err) {
            setDownloadError(err instanceof Error ? err.message : t("pedidos.detalhe.downloadError"));
        } finally {
            setDownloading(false);
        }
    }

    return (
        <>
        {zoomSrc && <ImageLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />}
        <div className="modal-overlay" onClick={onClose}>
            <section
                className={cn("modal-card pedido-detalhe-modal", editando && "is-editing")}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pedido-detalhe-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header pedido-detalhe-header">
                    <div>
                        <span className="pedido-detalhe-kicker">{editando ? t("pedidos.detalhe.kickerEditing") : t("pedidos.detalhe.kicker")}</span>
                        <h2 id="pedido-detalhe-titulo">
                            {pedido ? pedido.projeto : t("pedidos.detalhe.loadingTitle")}
                        </h2>
                    </div>
                    <div className="pedido-detalhe-header-actions">
                        {pedido && !editando && (
                            <button type="button" className="pedido-edit-btn" onClick={() => iniciarEdicao(pedido)}>
                                <PencilEdit02Icon size={15} />
                                {t("pedidos.detalhe.edit")}
                            </button>
                        )}

                        <button
                            type="button"
                            className="pedido-edit-btn"
                            onClick={() => gerarOrdemServico(pedidoId)}
                        >
                            <Download01Icon size={15} />
                            {t("pedidos.detalhe.pdf")}
                        </button>
                        <button className="modal-close" onClick={onClose} aria-label={t("pedidos.form.close")}>
                            <Cancel01Icon size={18} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="pedido-detalhe-loading">
                        <div className="pedido-row-skeleton" />
                        <div className="pedido-detalhe-gallery-skeleton" />
                    </div>
                ) : error ? (
                    <div className="dashboard-error">{error}</div>
                ) : pedido && editando ? (
                    <form className="pedido-edit-form" onSubmit={handleSalvar}>
                        {erroEdicao && <p className="pedido-edit-error" role="alert">{erroEdicao}</p>}

                        <div className="pedido-edit-grid">
                            <div className="input-group">
                                <label htmlFor="pedido-cliente">{t("pedidos.form.clientLabel")}</label>
                                <input
                                    id="pedido-cliente"
                                    ref={clienteRef}
                                    className={erros.cliente ? "input-error" : ""}
                                    value={cliente}
                                    onChange={(e) => { setCliente(e.target.value); limparErro("cliente"); }}
                                    placeholder={t("pedidos.form.clientPlaceholder")}
                                    aria-invalid={!!erros.cliente}
                                    aria-describedby={erros.cliente ? "pedido-cliente-erro" : undefined}
                                    autoFocus
                                />
                                <span className="input-hint" id="pedido-cliente-erro">
                                    {erros.cliente && <span className="error-text">{erros.cliente}</span>}
                                </span>
                            </div>
                            <div className="input-group">
                                <label htmlFor="pedido-projeto">{t("pedidos.form.projectLabel")}</label>
                                <input
                                    id="pedido-projeto"
                                    ref={projetoRef}
                                    className={erros.projeto ? "input-error" : ""}
                                    value={projeto}
                                    onChange={(e) => { setProjeto(e.target.value); limparErro("projeto"); }}
                                    placeholder={t("pedidos.form.projectPlaceholder")}
                                    aria-invalid={!!erros.projeto}
                                    aria-describedby={erros.projeto ? "pedido-projeto-erro" : undefined}
                                />
                                <span className="input-hint" id="pedido-projeto-erro">
                                    {erros.projeto && <span className="error-text">{erros.projeto}</span>}
                                </span>
                            </div>
                            <div className="input-group">
                                <label htmlFor="pedido-prazo">{t("pedidos.form.deadlineLabel")}</label>
                                <input
                                    id="pedido-prazo"
                                    ref={prazoRef}
                                    type="date"
                                    className={erros.prazo ? "input-error" : ""}
                                    value={prazo}
                                    onChange={(e) => { setPrazo(e.target.value); limparErro("prazo"); }}
                                    aria-invalid={!!erros.prazo}
                                    aria-describedby={erros.prazo ? "pedido-prazo-erro" : undefined}
                                />
                                <span className="input-hint" id="pedido-prazo-erro">
                                    {erros.prazo && <span className="error-text">{erros.prazo}</span>}
                                </span>
                            </div>
                            <div className="input-group">
                                <label htmlFor="pedido-status">{t("pedidos.form.stageLabel")}</label>
                                <Select
                                    id="pedido-status"
                                    value={status}
                                    onChange={(v) => setStatus(v as PedidoStatus)}
                                    options={STATUS_OPTIONS.map((opcao) => ({ value: opcao, label: t(`pedidos.status.${opcao}`) }))}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="pedido-descricao">{t("pedidos.form.descriptionLabel")}</label>
                            <textarea
                                id="pedido-descricao"
                                rows={3}
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder={t("pedidos.form.descriptionPlaceholder")}
                            />
                        </div>

                        <div className="pedido-edit-section">
                            <div className="pedido-edit-section-title">
                                <div>
                                    <h3>{t("pedidos.detalhe.object3dSectionTitle")}</h3>
                                    <span>{t("pedidos.detalhe.object3dSectionHint")}</span>
                                </div>
                            </div>

                            {pedido.objeto3DFileId && !removerObjeto3D && !objeto3D && (
                                <div className="pedido-edit-file">
                                    <span className="pedido-arquivo-icon"><File01Icon size={20} /></span>
                                    <div>
                                        <strong>{t("pedidos.detalhe.object3dCurrent")}</strong>
                                        <span>{t("pedidos.detalhe.object3dKeepHint")}</span>
                                    </div>
                                    <button type="button" className="pedido-remove-btn" onClick={() => setRemoverObjeto3D(true)}>
                                        <Delete02Icon size={15} /> {t("pedidos.detalhe.object3dRemove")}
                                    </button>
                                </div>
                            )}

                            {objeto3D && (
                                <div className="pedido-edit-file is-new">
                                    <span className="pedido-arquivo-icon"><File01Icon size={20} /></span>
                                    <div>
                                        <strong>{objeto3D.name}</strong>
                                        <span>{t("pedidos.detalhe.object3dNew")}</span>
                                    </div>
                                    <button type="button" className="pedido-remove-btn" onClick={() => setObjeto3D(null)}>
                                        <Cancel01Icon size={15} /> {t("pedidos.form.removeFile")}
                                    </button>
                                </div>
                            )}

                            {removerObjeto3D && !objeto3D && (
                                <div className="pedido-removal-notice">
                                    {t("pedidos.detalhe.object3dRemovalNotice")}
                                    <button type="button" onClick={() => setRemoverObjeto3D(false)}>{t("pedidos.detalhe.undo")}</button>
                                </div>
                            )}

                            <label className="pedido-upload-btn">
                                <Add01Icon size={16} />
                                {pedido.objeto3DFileId ? t("pedidos.detalhe.object3dSelectNew") : t("pedidos.detalhe.object3dAdd")}
                                <input
                                    type="file"
                                    accept=".stl,.obj,.fbx,.glb,.gltf,.3mf"
                                    onChange={(e) => {
                                        setObjeto3D(e.target.files?.[0] ?? null);
                                        setRemoverObjeto3D(false);
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                            <span className="input-hint">{t("pedidos.form.object3dFormats")}</span>
                        </div>

                        <div className="pedido-edit-section">
                            <div className="pedido-edit-section-title">
                                <div>
                                    <h3>{t("pedidos.detalhe.imagesSectionTitle")}</h3>
                                    <span>{t("pedidos.detalhe.imagesSectionHint")}</span>
                                </div>
                                <label className="pedido-upload-btn">
                                    <Add01Icon size={16} />
                                    {t("pedidos.detalhe.imagesAdd")}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => {
                                            adicionarImagens(e.target.files);
                                            e.target.value = "";
                                        }}
                                    />
                                </label>
                            </div>

                            {(imagensAtuais.length > 0 || novasImagens.length > 0) ? (
                                <div className="pedido-edit-images">
                                    {imagensAtuais.map((imagem, index) => {
                                        const removida = imagensRemover.has(imagem.id);
                                        return (
                                            <div key={imagem.id || index} className={cn("pedido-edit-image", removida && "is-removed")}>
                                                <img
                                                    src={imagem.src}
                                                    alt={t("pedidos.detalhe.imageCurrentAlt", { index: index + 1 })}
                                                    onClick={() => setZoomSrc(imagem.src)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => { if (e.key === "Enter") setZoomSrc(imagem.src); }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => alternarRemocaoImagem(imagem.id)}
                                                    disabled={!imagem.id}
                                                >
                                                    {removida ? t("pedidos.detalhe.undo") : <><Delete02Icon size={14} /> {t("pedidos.detalhe.imageDelete")}</>}
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {novasImagens.map(({ id, url }, index) => (
                                        <div key={id} className="pedido-edit-image is-new">
                                            <img
                                                src={url}
                                                alt={t("pedidos.detalhe.imageNewAlt", { index: index + 1 })}
                                                onClick={() => setZoomSrc(url)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => { if (e.key === "Enter") setZoomSrc(url); }}
                                            />
                                            <span>{t("pedidos.detalhe.imageNewBadge")}</span>
                                            <button
                                                type="button"
                                                onClick={() => retirarNovaImagem(id)}
                                            >
                                                <Cancel01Icon size={14} /> {t("pedidos.form.removeFile")}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="pedido-detalhe-empty"><Image02Icon size={16} /> {t("pedidos.detalhe.imagesEmpty")}</p>
                            )}
                        </div>

                        <div className="modal-actions pedido-edit-actions">
                            <button type="button" className="btn-secondary" onClick={cancelarEdicao} disabled={salvando}>
                                {t("pedidos.form.cancel")}
                            </button>
                            <button type="submit" className="button" disabled={salvando}>
                                {salvando ? t("pedidos.detalhe.saving") : t("pedidos.detalhe.save")}
                            </button>
                        </div>
                    </form>
                ) : pedido && (
                    <div className="pedido-detalhe-content">
                        <div className="pedido-detalhe-meta">
                            <span className={cn("pedido-chip", pedido.status === "FINALIZADO" ? "chip-done" : "chip-active")}>
                                {t(`pedidos.status.${pedido.status}`)}
                            </span>
                            <span className="pedido-detalhe-ref">#{pedido.id.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase()}</span>
                        </div>

                        <div className="pedido-detalhe-info-grid">
                            <div className="pedido-detalhe-info">
                                <UserIcon size={17} />
                                <span>{t("pedidos.form.clientLabel")}</span>
                                <strong>{pedido.cliente}</strong>
                            </div>
                            <div className="pedido-detalhe-info">
                                <Calendar03Icon size={17} />
                                <span>{t("pedidos.form.deadlineLabel")}</span>
                                <strong>{formatPrazoLongo(pedido.prazo)}</strong>
                            </div>
                            <div className="pedido-detalhe-info">
                                <CubeIcon size={17} />
                                <span>{t("pedidos.form.projectLabel")}</span>
                                <strong>{pedido.projeto}</strong>
                            </div>
                        </div>

                        {pedido.descricao && (
                            <div className="pedido-detalhe-section">
                                <h3>{t("pedidos.form.descriptionLabel")}</h3>
                                <p>{pedido.descricao}</p>
                            </div>
                        )}

                        <div className="pedido-detalhe-section">
                            <h3>{t("pedidos.detalhe.object3dSectionTitle")}</h3>
                            {pedido.objeto3DFileId ? (
                                <div className="pedido-arquivo-3d">
                                    <span className="pedido-arquivo-icon"><File01Icon size={20} /></span>
                                    <div>
                                        <strong>{t("pedidos.detalhe.viewObject3dName")}</strong>
                                        <span>{t("pedidos.detalhe.viewObject3dHint")}</span>
                                    </div>
                                    <button type="button" className="pedido-download-btn" onClick={handleDownloadObjeto3D} disabled={downloading}>
                                        <Download01Icon size={16} />
                                        {downloading ? t("pedidos.detalhe.downloading") : t("pedidos.detalhe.download")}
                                    </button>
                                </div>
                            ) : (
                                <p className="pedido-detalhe-empty">{t("pedidos.detalhe.viewObject3dEmpty")}</p>
                            )}
                            {downloadError && <p className="pedido-download-error" role="alert">{downloadError}</p>}
                        </div>

                        <div className="pedido-detalhe-section">
                            <h3>{t("pedidos.detalhe.imagesSectionTitle")}</h3>
                            {imagensAtuais.length > 0 ? (
                                <div className="pedido-imagens-grid">
                                    {imagensAtuais.map((imagem, index) => (
                                        <button
                                            key={imagem.id || index}
                                            type="button"
                                            className="pedido-imagem-link"
                                            onClick={() => setZoomSrc(imagem.src)}
                                            aria-label={t("pedidos.detalhe.zoomImageAria", { index: index + 1 })}
                                        >
                                            <img src={imagem.src} alt={t("pedidos.detalhe.imageAlt", { index: index + 1, project: pedido.projeto })} />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="pedido-detalhe-empty"><Image02Icon size={16} /> {t("pedidos.detalhe.viewImagesEmpty")}</p>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
        </>
    );
}

export default PedidoDetalheModal;
