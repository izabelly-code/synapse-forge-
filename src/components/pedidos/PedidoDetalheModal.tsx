import { useEffect, useMemo, useRef, useState } from "react";
import {
    FiBox,
    FiCalendar,
    FiDownload,
    FiEdit2,
    FiFile,
    FiImage,
    FiPlus,
    FiTrash2,
    FiUser,
    FiX,
} from "react-icons/fi";

import {
    baixarObjeto3D,
    editarPedido,
    getPedido,
    gerarOrdemServico
} from "../../services/PedidoService";

import { Pedido, PedidoStatus } from "../../types";
import Select from "../ui/Select";

const STATUS_LABELS: Record<PedidoStatus, string> = {
    MODELAGEM: "Modelagem",
    IMPRESSAO: "Impressao",
    PINTURA: "Pintura",
    ACABAMENTO: "Acabamento",
    FINALIZADO: "Finalizado",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as PedidoStatus[];

function formatDate(iso: string): string {
    const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

interface PedidoDetalheModalProps {
    pedidoId: string;
    onClose: () => void;
    onUpdated?: (pedido: Pedido) => void;
}

interface NovaImagem {
    id: string;
    arquivo: File;
    url: string;
}

function PedidoDetalheModal({ pedidoId, onClose, onUpdated }: PedidoDetalheModalProps) {
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editando, setEditando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erroEdicao, setErroEdicao] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");

    const [cliente, setCliente] = useState("");
    const [projeto, setProjeto] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prazo, setPrazo] = useState("");
    const [status, setStatus] = useState<PedidoStatus>("MODELAGEM");
    const [objeto3D, setObjeto3D] = useState<File | null>(null);
    const [removerObjeto3D, setRemoverObjeto3D] = useState(false);
    const [novasImagens, setNovasImagens] = useState<NovaImagem[]>([]);
    const [imagensRemover, setImagensRemover] = useState<Set<string>>(new Set());
    const novasImagensRef = useRef<NovaImagem[]>([]);

    useEffect(() => {
        let active = true;

        async function fetchPedido() {
            setLoading(true);
            setError("");
            try {
                const data = await getPedido(pedidoId);
                if (active) setPedido(data);
            } catch {
                if (active) setError("Erro ao carregar os dados do pedido.");
            } finally {
                if (active) setLoading(false);
            }
        }

        fetchPedido();
        return () => { active = false; };
    }, [pedidoId]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key !== "Escape") return;
            if (editando) {
                setEditando(false);
                setErroEdicao("");
            } else {
                onClose();
            }
        }
        document.addEventListener("keydown", onKey);
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflowAnterior;
        };
    }, [editando, onClose]);

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

    function atualizarNovasImagens(proximas: NovaImagem[]) {
        novasImagensRef.current = proximas;
        setNovasImagens(proximas);
    }

    function limparNovasImagens() {
        novasImagensRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
        atualizarNovasImagens([]);
    }

    function adicionarImagens(files: FileList | null) {
        if (!files?.length) return;

        const selecionadas = Array.from(files)
            .filter((arquivo) => arquivo.type.startsWith("image/"))
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

    function iniciarEdicao() {
        if (!pedido) return;
        setCliente(pedido.cliente);
        setProjeto(pedido.projeto);
        setDescricao(pedido.descricao ?? "");
        setPrazo(pedido.prazo.slice(0, 10));
        setStatus(pedido.status);
        setObjeto3D(null);
        setRemoverObjeto3D(false);
        limparNovasImagens();
        setImagensRemover(new Set());
        setErroEdicao("");
        setEditando(true);
    }

    function cancelarEdicao() {
        setEditando(false);
        setErroEdicao("");
        setObjeto3D(null);
        limparNovasImagens();
        setImagensRemover(new Set());
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
        if (!pedido || !cliente.trim() || !projeto.trim() || !prazo) {
            setErroEdicao("Preencha cliente, projeto e prazo.");
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
            setErroEdicao("Nao foi possivel salvar as alteracoes.");
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
            setDownloadError(err instanceof Error ? err.message : "Nao foi possivel baixar o arquivo 3D.");
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <section
                className={`modal-card pedido-detalhe-modal ${editando ? "is-editing" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pedido-detalhe-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header pedido-detalhe-header">
                    <div>
                        <span className="pedido-detalhe-kicker">{editando ? "Editando pedido" : "Pedido"}</span>
                        <h2 id="pedido-detalhe-titulo">
                            {pedido ? pedido.projeto : "Carregando pedido"}
                        </h2>
                    </div>
                    <div className="pedido-detalhe-header-actions">
                        {pedido && !editando && (
                            <button type="button" className="pedido-edit-btn" onClick={iniciarEdicao}>
                                <FiEdit2 size={15} />
                                Editar
                            </button>
                        )}

                        <button
                            type="button"
                            className="pedido-edit-btn"
                            onClick={() => gerarOrdemServico(pedidoId)}
                        >
                            <FiDownload size={15} />
                            PDF
                        </button>
                        <button className="modal-close" onClick={onClose} aria-label="Fechar">
                            <FiX size={18} />
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
                                <label htmlFor="pedido-cliente">Cliente</label>
                                <input id="pedido-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label htmlFor="pedido-projeto">Projeto</label>
                                <input id="pedido-projeto" value={projeto} onChange={(e) => setProjeto(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label htmlFor="pedido-prazo">Prazo</label>
                                <input id="pedido-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label htmlFor="pedido-status">Etapa</label>
                                <Select
                                    id="pedido-status"
                                    value={status}
                                    onChange={(v) => setStatus(v as PedidoStatus)}
                                    options={STATUS_OPTIONS.map((opcao) => ({ value: opcao, label: STATUS_LABELS[opcao] }))}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="pedido-descricao">Descricao</label>
                            <textarea
                                id="pedido-descricao"
                                rows={4}
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                            />
                        </div>

                        <div className="pedido-edit-section">
                            <div className="pedido-edit-section-title">
                                <div>
                                    <h3>Objeto 3D</h3>
                                    <span>Substitua ou remova o arquivo atual.</span>
                                </div>
                            </div>

                            {pedido.objeto3DFileId && !removerObjeto3D && !objeto3D && (
                                <div className="pedido-edit-file">
                                    <span className="pedido-arquivo-icon"><FiFile size={20} /></span>
                                    <div>
                                        <strong>Objeto 3D atual</strong>
                                        <span>O arquivo sera preservado se nenhuma acao for feita.</span>
                                    </div>
                                    <button type="button" className="pedido-remove-btn" onClick={() => setRemoverObjeto3D(true)}>
                                        <FiTrash2 size={15} /> Remover
                                    </button>
                                </div>
                            )}

                            {objeto3D && (
                                <div className="pedido-edit-file is-new">
                                    <span className="pedido-arquivo-icon"><FiFile size={20} /></span>
                                    <div>
                                        <strong>{objeto3D.name}</strong>
                                        <span>Novo arquivo selecionado</span>
                                    </div>
                                    <button type="button" className="pedido-remove-btn" onClick={() => setObjeto3D(null)}>
                                        <FiX size={15} /> Retirar
                                    </button>
                                </div>
                            )}

                            {removerObjeto3D && !objeto3D && (
                                <div className="pedido-removal-notice">
                                    O objeto atual sera excluido ao salvar.
                                    <button type="button" onClick={() => setRemoverObjeto3D(false)}>Desfazer</button>
                                </div>
                            )}

                            <label className="pedido-upload-btn">
                                <FiPlus size={16} />
                                {pedido.objeto3DFileId ? "Selecionar novo objeto" : "Adicionar objeto 3D"}
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
                        </div>

                        <div className="pedido-edit-section">
                            <div className="pedido-edit-section-title">
                                <div>
                                    <h3>Imagens de referencia</h3>
                                    <span>Remova imagens atuais ou acrescente novas.</span>
                                </div>
                                <label className="pedido-upload-btn">
                                    <FiPlus size={16} />
                                    Adicionar imagens
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
                                            <div key={imagem.id || index} className={`pedido-edit-image ${removida ? "is-removed" : ""}`}>
                                                <img src={imagem.src} alt={`Referencia atual ${index + 1}`} />
                                                <button
                                                    type="button"
                                                    onClick={() => alternarRemocaoImagem(imagem.id)}
                                                    disabled={!imagem.id}
                                                >
                                                    {removida ? "Desfazer" : <><FiTrash2 size={14} /> Excluir</>}
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {novasImagens.map(({ id, url }, index) => (
                                        <div key={id} className="pedido-edit-image is-new">
                                            <img src={url} alt={`Nova referencia ${index + 1}`} />
                                            <span>Nova</span>
                                            <button
                                                type="button"
                                                onClick={() => retirarNovaImagem(id)}
                                            >
                                                <FiX size={14} /> Retirar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="pedido-detalhe-empty"><FiImage size={16} /> Nenhuma imagem adicionada.</p>
                            )}
                        </div>

                        <div className="modal-actions pedido-edit-actions">
                            <button type="button" className="btn-secondary" onClick={cancelarEdicao} disabled={salvando}>
                                Cancelar
                            </button>
                            <button type="submit" className="button" disabled={salvando}>
                                {salvando ? "Salvando..." : "Salvar alteracoes"}
                            </button>
                        </div>
                    </form>
                ) : pedido && (
                    <div className="pedido-detalhe-content">
                        <div className="pedido-detalhe-meta">
                            <span className={`pedido-chip ${pedido.status === "FINALIZADO" ? "chip-done" : "chip-active"}`}>
                                {STATUS_LABELS[pedido.status]}
                            </span>
                            <span className="pedido-detalhe-ref">#{pedido.id.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase()}</span>
                        </div>

                        <div className="pedido-detalhe-info-grid">
                            <div className="pedido-detalhe-info">
                                <FiUser size={17} />
                                <span>Cliente</span>
                                <strong>{pedido.cliente}</strong>
                            </div>
                            <div className="pedido-detalhe-info">
                                <FiCalendar size={17} />
                                <span>Prazo</span>
                                <strong>{formatDate(pedido.prazo)}</strong>
                            </div>
                            <div className="pedido-detalhe-info">
                                <FiBox size={17} />
                                <span>Projeto</span>
                                <strong>{pedido.projeto}</strong>
                            </div>
                        </div>

                        {pedido.descricao && (
                            <div className="pedido-detalhe-section">
                                <h3>Descricao</h3>
                                <p>{pedido.descricao}</p>
                            </div>
                        )}

                        <div className="pedido-detalhe-section">
                            <h3>Objeto 3D</h3>
                            {pedido.objeto3DFileId ? (
                                <div className="pedido-arquivo-3d">
                                    <span className="pedido-arquivo-icon"><FiFile size={20} /></span>
                                    <div>
                                        <strong>Objeto 3D do pedido</strong>
                                        <span>Arquivo do modelo enviado para producao</span>
                                    </div>
                                    <button type="button" className="pedido-download-btn" onClick={handleDownloadObjeto3D} disabled={downloading}>
                                        <FiDownload size={16} />
                                        {downloading ? "Baixando..." : "Baixar"}
                                    </button>
                                </div>
                            ) : (
                                <p className="pedido-detalhe-empty">Nenhum objeto 3D foi enviado.</p>
                            )}
                            {downloadError && <p className="pedido-download-error" role="alert">{downloadError}</p>}
                        </div>

                        <div className="pedido-detalhe-section">
                            <h3>Imagens de referencia</h3>
                            {imagensAtuais.length > 0 ? (
                                <div className="pedido-imagens-grid">
                                    {imagensAtuais.map((imagem, index) => (
                                        <a
                                            key={imagem.id || index}
                                            className="pedido-imagem-link"
                                            href={imagem.src}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`Abrir imagem ${index + 1}`}
                                        >
                                            <img src={imagem.src} alt={`Referencia ${index + 1} do pedido ${pedido.projeto}`} />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="pedido-detalhe-empty"><FiImage size={16} /> Nenhuma imagem de referencia foi enviada.</p>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default PedidoDetalheModal;
