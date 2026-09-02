import { useEffect, useMemo, useRef, useState } from "react";
import { Add01Icon, Cancel01Icon, File01Icon, Image02Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { criarPedido } from "../../services/PedidoService";
import { getClientes } from "../../services/UserService";
import type { User } from "../../types";
import ImageLightbox from "../ui/ImageLightbox";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import IconButton from "../ui/IconButton";
import LoadingButton from "../ui/LoadingButton";

interface NovoPedidoModalProps {
    onClose: () => void;
    onCriado: () => void;
}

type CampoErro = "cliente" | "projeto" | "prazo";
type Erros = Partial<Record<CampoErro, string>>;

function NovoPedidoModal({ onClose, onCriado }: NovoPedidoModalProps) {
    const { t } = useTranslation();
    const [clientes, setClientes] = useState<User[]>([]);
    const [carregandoClientes, setCarregandoClientes] = useState(true);
    const [erroClientes, setErroClientes] = useState("");
    const [clienteId, setClienteId] = useState("");
    const [cliente, setCliente] = useState("");
    const [projeto, setProjeto] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prazo, setPrazo] = useState("");
    const [objeto3D, setObjeto3D] = useState<File | null>(null);
    const [imagensReferencia, setImagensReferencia] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [erros, setErros] = useState<Erros>({});
    const [erroEnvio, setErroEnvio] = useState("");
    const [zoomSrc, setZoomSrc] = useState<string | null>(null);

    const clienteRef = useRef<HTMLSelectElement>(null);
    const projetoRef = useRef<HTMLInputElement>(null);
    const prazoRef = useRef<HTMLInputElement>(null);
    const painelRef = useRef<HTMLElement>(null);

    const hoje = new Date().toISOString().split("T")[0];

    useEscapeKey(onClose);
    useBodyScrollLock();
    useFocusTrap(painelRef);

    // RF12: pedido é vinculado a um usuário CLIENTE; o backend devolve só usuários com essa role.
    useEffect(() => {
        const token = localStorage.getItem("token");
        setCarregandoClientes(true);
        setErroClientes("");
        getClientes(token)
            .then((usuarios) => setClientes(usuarios))
            .catch(() => setErroClientes(t("pedidos.form.errorLoadClients")))
            .finally(() => setCarregandoClientes(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleClienteChange(id: string) {
        setClienteId(id);
        limparErro("cliente");
        if (!id) {
            setCliente("");
            return;
        }
        const selecionado = clientes.find((usuario) => usuario.id === id);
        setCliente(selecionado?.nome ?? "");
    }

    const previews = useMemo(
        () => imagensReferencia.map((file) => ({ file, url: URL.createObjectURL(file) })),
        [imagensReferencia]
    );

    useEffect(() => {
        return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
    }, [previews]);

    function adicionarImagens(novas: FileList | null) {
        if (!novas) return;
        const selecionadas = Array.from(novas).filter((f) => f.type.startsWith("image/"));
        setImagensReferencia((prev) => {
            const chaves = new Set(prev.map((f) => `${f.name}-${f.size}`));
            const unicas = selecionadas.filter((f) => !chaves.has(`${f.name}-${f.size}`));
            return [...prev, ...unicas];
        });
    }

    function removerImagem(index: number) {
        setImagensReferencia((prev) => prev.filter((_, i) => i !== index));
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
        // Cliente é opcional (RF12): o pedido pode nascer sem vínculo.
        if (!projeto.trim()) e.projeto = t("pedidos.form.errorProject");
        if (!prazo) e.prazo = t("pedidos.form.errorDeadline");
        else if (prazo < hoje) e.prazo = t("pedidos.form.errorDeadlinePast");
        return e;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        setErroEnvio("");

        const novosErros = validar();
        if (Object.keys(novosErros).length > 0) {
            setErros(novosErros);
            if (novosErros.projeto) projetoRef.current?.focus();
            else if (novosErros.prazo) prazoRef.current?.focus();
            return;
        }

        const data = {
            clienteId: clienteId || undefined,
            cliente: cliente.trim(),
            projeto: projeto.trim(),
            descricao: descricao.trim(),
            prazo,
            objeto3D,
            imagensReferencia,
        };

        try {
            setLoading(true);
            await criarPedido(data);
            onCriado();
        } catch (error) {
            setErroEnvio(error instanceof Error && error.message !== "Falha ao criar pedido"
                ? error.message
                : t("pedidos.novo.errorSubmit"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
        {zoomSrc && <ImageLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />}
        <div className="modal-overlay" onClick={onClose}>
            <section
                ref={painelRef}
                className="modal-card pedido-detalhe-modal is-editing"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header pedido-detalhe-header">
                    <div>
                        <span className="pedido-detalhe-kicker">{t("pedidos.novo.kicker")}</span>
                        <h2 id="modal-titulo">{projeto.trim() || t("pedidos.novo.title")}</h2>
                    </div>
                    <div className="pedido-detalhe-header-actions">
                        <IconButton variant="modal-close" onClick={onClose} aria-label={t("pedidos.form.close")}>
                            <Cancel01Icon size={18} />
                        </IconButton>
                    </div>
                </div>

                <form className="pedido-edit-form" onSubmit={handleSubmit} noValidate>
                    {erroEnvio && <p className="pedido-edit-error" role="alert">{erroEnvio}</p>}

                    <div className="pedido-edit-grid">
                        <div className="input-group">
                            <label htmlFor="cliente">{t("pedidos.form.clientLabel")}</label>
                            <select
                                id="cliente"
                                ref={clienteRef}
                                className={erros.cliente ? "input-error" : ""}
                                value={clienteId}
                                onChange={(e) => handleClienteChange(e.target.value)}
                                aria-invalid={!!erros.cliente}
                                aria-describedby={erros.cliente ? "cliente-erro" : undefined}
                                autoFocus
                                disabled={carregandoClientes}
                            >
                                <option value="">
                                    {carregandoClientes ? t("pedidos.form.loadingClients") : t("pedidos.form.noClientLinked")}
                                </option>
                                {!carregandoClientes && clientes.map((usuario) => (
                                    <option key={usuario.id} value={usuario.id}>
                                        {usuario.nome} — {usuario.email}
                                    </option>
                                ))}
                            </select>
                            {erroClientes && <span className="error-text">{erroClientes}</span>}
                            <span className="input-hint" id="cliente-erro">
                                {erros.cliente && <span className="error-text">{erros.cliente}</span>}
                            </span>
                        </div>

                        <div className="input-group">
                            <label htmlFor="projeto">{t("pedidos.form.projectLabel")}</label>
                            <input
                                id="projeto"
                                ref={projetoRef}
                                className={erros.projeto ? "input-error" : ""}
                                value={projeto}
                                onChange={(e) => { setProjeto(e.target.value); limparErro("projeto"); }}
                                placeholder={t("pedidos.form.projectPlaceholder")}
                                aria-invalid={!!erros.projeto}
                                aria-describedby={erros.projeto ? "projeto-erro" : undefined}
                            />
                            <span className="input-hint" id="projeto-erro">
                                {erros.projeto && <span className="error-text">{erros.projeto}</span>}
                            </span>
                        </div>

                        <div className="input-group">
                            <label htmlFor="prazo">{t("pedidos.form.deadlineLabel")}</label>
                            <input
                                id="prazo"
                                ref={prazoRef}
                                type="date"
                                className={erros.prazo ? "input-error" : ""}
                                value={prazo}
                                onChange={(e) => { setPrazo(e.target.value); limparErro("prazo"); }}
                                min={hoje}
                                aria-invalid={!!erros.prazo}
                                aria-describedby={erros.prazo ? "prazo-erro" : undefined}
                            />
                            <span className="input-hint" id="prazo-erro">
                                {erros.prazo && <span className="error-text">{erros.prazo}</span>}
                            </span>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="descricao">{t("pedidos.form.descriptionLabel")}</label>
                        <textarea
                            id="descricao"
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
                                <span>{t("pedidos.novo.object3dSectionHint")}</span>
                            </div>
                        </div>

                        {objeto3D && (
                            <div className="pedido-edit-file is-new">
                                <span className="pedido-arquivo-icon"><File01Icon size={20} /></span>
                                <div>
                                    <strong>{objeto3D.name}</strong>
                                    <span>{t("pedidos.novo.object3dSelected")}</span>
                                </div>
                                <button type="button" className="pedido-remove-btn" onClick={() => setObjeto3D(null)}>
                                    <Cancel01Icon size={15} /> {t("pedidos.form.removeFile")}
                                </button>
                            </div>
                        )}

                        <label className="pedido-upload-btn">
                            <Add01Icon size={16} />
                            {objeto3D ? t("pedidos.novo.object3dReplace") : t("pedidos.novo.object3dAdd")}
                            <input
                                type="file"
                                accept=".stl,.obj,.fbx,.glb,.gltf,.3mf"
                                onChange={(e) => { setObjeto3D(e.target.files?.[0] ?? null); e.target.value = ""; }}
                            />
                        </label>
                        <span className="input-hint">{t("pedidos.form.object3dFormats")}</span>
                    </div>

                    <div className="pedido-edit-section">
                        <div className="pedido-edit-section-title">
                            <div>
                                <h3>{t("pedidos.detalhe.imagesSectionTitle")}</h3>
                                <span>{t("pedidos.novo.imagesSectionHint")}</span>
                            </div>
                            <label className="pedido-upload-btn">
                                <Add01Icon size={16} />
                                {t("pedidos.novo.imagesAdd")}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => { adicionarImagens(e.target.files); e.target.value = ""; }}
                                />
                            </label>
                        </div>

                        {previews.length > 0 ? (
                            <div className="pedido-edit-images">
                                {previews.map((p, i) => (
                                    <div key={`${p.file.name}-${p.file.size}-${i}`} className="pedido-edit-image is-new">
                                        <img
                                            src={p.url}
                                            alt={p.file.name}
                                            onClick={() => setZoomSrc(p.url)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => { if (e.key === "Enter") setZoomSrc(p.url); }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removerImagem(i)}
                                            aria-label={t("pedidos.novo.removeImageAria", { name: p.file.name })}
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
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            {t("pedidos.form.cancel")}
                        </button>
                        <LoadingButton pending={loading} pendingLabel={t("pedidos.novo.submitting")}>
                            {t("pedidos.novo.submit")}
                        </LoadingButton>
                    </div>
                </form>
            </section>
        </div>
        </>
    );
}

export default NovoPedidoModal;
