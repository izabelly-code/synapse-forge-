import { useEffect, useMemo, useState } from "react";
import { FiBox, FiCalendar, FiDownload, FiFile, FiImage, FiUser, FiX } from "react-icons/fi";
import { getPedido, baixarObjeto3D } from "../services/PedidoService";
import { Pedido, PedidoStatus } from "../types";

const STATUS_LABELS: Record<PedidoStatus, string> = {
    MODELAGEM: "Modelagem",
    IMPRESSAO: "Impressao",
    PINTURA: "Pintura",
    ACABAMENTO: "Acabamento",
    FINALIZADO: "Finalizado",
};

function formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

function isBase64String(value: string): boolean {
    const clean = value.trim();
    if (!clean || clean.length % 4 !== 0) return false;
    return /^[A-Za-z0-9+/]+={0,2}$/.test(clean);
}

function resolveAssetUrl(path?: string): string {
    if (!path) return "";
    if (isAbsoluteUrl(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
    if (isBase64String(path)) return `data:image/png;base64,${path}`;
    return `http://localhost:8081/${path.replace(/^\/+/, "")}`;
}

interface PedidoDetalheModalProps {
    pedidoId: string;
    onClose: () => void;
}

function PedidoDetalheModal({ pedidoId, onClose }: PedidoDetalheModalProps) {
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");

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
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflowAnterior;
        };
    }, [onClose]);

    const imagens = useMemo(() => pedido?.imagensReferenciaFileIds?.filter(Boolean) ?? [], [pedido]);

    async function handleDownloadObjeto3D() {
        if (!pedido?.objeto3DFileId || downloading) return;

        setDownloading(true);
        setDownloadError("");
        try {
            await baixarObjeto3D(pedido.id);
        } catch (err) {
            setDownloadError(
                err instanceof Error ? err.message : "Nao foi possivel baixar o arquivo 3D."
            );
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <section
                className="modal-card pedido-detalhe-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pedido-detalhe-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header pedido-detalhe-header">
                    <div>
                        <span className="pedido-detalhe-kicker">Pedido</span>
                        <h2 id="pedido-detalhe-titulo">
                            {pedido ? pedido.projeto : "Carregando pedido"}
                        </h2>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Fechar">
                        <FiX size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="pedido-detalhe-loading">
                        <div className="pedido-row-skeleton" />
                        <div className="pedido-detalhe-gallery-skeleton" />
                    </div>
                ) : error ? (
                    <div className="dashboard-error">{error}</div>
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
                                    <button
                                        type="button"
                                        className="pedido-download-btn"
                                        onClick={handleDownloadObjeto3D}
                                        disabled={downloading}
                                    >
                                        <FiDownload size={16} />
                                        {downloading ? "Baixando..." : "Baixar"}
                                    </button>
                                </div>
                            ) : (
                                <p className="pedido-detalhe-empty">Nenhum objeto 3D foi enviado.</p>
                            )}
                            {downloadError && (
                                <p className="pedido-download-error" role="alert">{downloadError}</p>
                            )}
                        </div>

                        <div className="pedido-detalhe-section">
                            <h3>Imagens de referencia</h3>
                            {imagens.length > 0 ? (
                                <div className="pedido-imagens-grid">
                                    {imagens.map((imagem, index) => {
                                        const src = resolveAssetUrl(imagem);
                                        return (
                                            <a
                                                key={`${imagem}-${index}`}
                                                className="pedido-imagem-link"
                                                href={src}
                                                target="_blank"
                                                rel="noreferrer"
                                                aria-label={`Abrir imagem ${index + 1}`}
                                            >
                                                <img src={src} alt={`Referencia ${index + 1} do pedido ${pedido.projeto}`} />
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="pedido-detalhe-empty">
                                    <FiImage size={16} />
                                    Nenhuma imagem de referencia foi enviada.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default PedidoDetalheModal;
