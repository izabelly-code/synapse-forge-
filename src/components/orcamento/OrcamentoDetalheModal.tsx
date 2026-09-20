import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Cancel01Icon, Calendar03Icon, CubeIcon, Download01Icon, File01Icon, Image02Icon, UserIcon } from "hugeicons-react";
import { Orcamento } from "../../models/Orcamento";
import { baixarObjeto3DOrcamento, getOrcamentoById } from "../../services/OrcamentoService";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import IconButton from "../ui/IconButton";
import ImageLightbox from "../ui/ImageLightbox";
import { formatCurrency, formatDate, formatNumber } from "../../utils/format";

interface OrcamentoDetalheModalProps {
    orcamento: Orcamento;
    onClose: () => void;
}

function formatarData(valor: string | null, options: Intl.DateTimeFormatOptions): string {
    if (!valor) return "—";
    const data = new Date(valor.length === 10 ? `${valor}T12:00:00` : valor);
    return Number.isNaN(data.getTime()) ? "—" : formatDate(data, options);
}

function numero(valor: number | undefined, sufixo = ""): string {
    return valor === undefined ? "—" : `${formatNumber(valor)}${sufixo}`;
}

function moeda(valor: number | undefined): string {
    return valor === undefined ? "—" : formatCurrency(valor);
}

function OrcamentoDetalheModal({ orcamento, onClose }: OrcamentoDetalheModalProps) {
    const { t } = useTranslation();
    const [orcamentoDetalhado, setOrcamentoDetalhado] = useState<Orcamento | null>(null);
    const painelRef = useRef<HTMLElement>(null);
    const [zoomSrc, setZoomSrc] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");

    useEffect(() => {
        let ativo = true;

        async function carregarDetalhes() {
            if (!orcamento.id) return;
            try {
                const detalhe = await getOrcamentoById(orcamento.id);
                if (ativo) setOrcamentoDetalhado(detalhe);
            } catch {
                // A linha da listagem continua disponível como fallback.
            }
        }

        setOrcamentoDetalhado(null);
        carregarDetalhes();
        return () => { ativo = false; };
    }, [orcamento.id]);

    const dadosOrcamento = orcamentoDetalhado ?? orcamento;

    useEscapeKey(onClose);
    useBodyScrollLock();
    useFocusTrap(painelRef);

    const status = dadosOrcamento.status ?? "PENDENTE";
    const dataCriacao = formatarData(dadosOrcamento.criadoEm, {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    async function handleDownloadObjeto3D() {
        if (!dadosOrcamento.id || downloading) return;
        setDownloading(true);
        setDownloadError("");
        try {
            await baixarObjeto3DOrcamento(dadosOrcamento.id);
        } catch {
            setDownloadError(t("orcamento.detalhe.downloadError"));
        } finally {
            setDownloading(false);
        }
    }

    return (
        <>
        {zoomSrc && <ImageLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />}
        <div className="modal-overlay" onClick={onClose}>
            <section
                ref={painelRef}
                className="modal-card pedido-detalhe-modal orcamento-detalhe-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="orcamento-detalhe-titulo"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="modal-header pedido-detalhe-header">
                    <div>
                        <span className="pedido-detalhe-kicker">{t("orcamento.detalhe.kicker")}</span>
                        <h2 id="orcamento-detalhe-titulo">{dadosOrcamento.projeto}</h2>
                    </div>
                    <IconButton variant="modal-close" onClick={onClose} aria-label={t("orcamento.detalhe.close")}>
                        <Cancel01Icon size={18} />
                    </IconButton>
                </div>

                <div className="pedido-detalhe-content">
                    <div className="pedido-detalhe-meta">
                        <span className={`orcamento-status orcamento-status-${status.toLowerCase()}`}>
                            {t(`orcamento.status.${status}`)}
                        </span>
                        <span className="pedido-detalhe-ref">{dataCriacao}</span>
                    </div>

                    <div className="pedido-detalhe-info-grid">
                        <div className="pedido-detalhe-info">
                            <UserIcon size={17} />
                            <span>{t("orcamento.detalhe.client")}</span>
                            <strong>{dadosOrcamento.cliente}</strong>
                        </div>
                        <div className="pedido-detalhe-info">
                            <CubeIcon size={17} />
                            <span>{t("orcamento.detalhe.project")}</span>
                            <strong>{dadosOrcamento.projeto}</strong>
                        </div>
                        <div className="pedido-detalhe-info">
                            <Calendar03Icon size={17} />
                            <span>{t("orcamento.detalhe.deadline")}</span>
                            <strong>{formatarData(dadosOrcamento.prazo, { day: "2-digit", month: "long", year: "numeric" })}</strong>
                        </div>
                    </div>

                    {dadosOrcamento.descricao && (
                        <div className="pedido-detalhe-section">
                            <h3>{t("orcamento.detalhe.description")}</h3>
                            <p>{dadosOrcamento.descricao}</p>
                        </div>
                    )}

                    <div className="pedido-detalhe-section">
                        <h3>{t("orcamento.detalhe.values")}</h3>
                        <div className="pedido-orcamento-detalhe-grid">
                            <div><span>{t("orcamento.detalhe.material")}</span><strong>{dadosOrcamento.nomeMaterial || dadosOrcamento.materialId || "—"}</strong></div>
                            <div><span>{t("orcamento.detalhe.volume")}</span><strong>{numero(dadosOrcamento.volumeCm3, " cm³")}</strong></div>
                            <div><span>{t("orcamento.detalhe.printTime")}</span><strong>{numero(dadosOrcamento.tempoImpressaoHoras, " h")}</strong></div>
                            <div><span>{t("orcamento.detalhe.laborTime")}</span><strong>{numero(dadosOrcamento.tempoMaoDeObraHoras, " h")}</strong></div>
                            <div><span>{t("orcamento.detalhe.machineHourlyCost")}</span><strong>{moeda(dadosOrcamento.custoMaquinaHora)}</strong></div>
                            <div><span>{t("orcamento.detalhe.laborHourlyCost")}</span><strong>{moeda(dadosOrcamento.custoMaoDeObraHora)}</strong></div>
                            <div><span>{t("orcamento.detalhe.margin")}</span><strong>{numero(dadosOrcamento.margemLucro, "%")}</strong></div>
                            <div><span>{t("orcamento.detalhe.materialCost")}</span><strong>{moeda(dadosOrcamento.custoMaterial)}</strong></div>
                            <div><span>{t("orcamento.detalhe.machineCost")}</span><strong>{moeda(dadosOrcamento.custoMaquina)}</strong></div>
                            <div><span>{t("orcamento.detalhe.laborCost")}</span><strong>{moeda(dadosOrcamento.custoMaoDeObra)}</strong></div>
                            <div><span>{t("orcamento.detalhe.totalCost")}</span><strong>{moeda(dadosOrcamento.custoTotal)}</strong></div>
                            <div className="pedido-orcamento-detalhe-final"><span>{t("orcamento.detalhe.finalPrice")}</span><strong>{moeda(dadosOrcamento.precoFinal)}</strong></div>
                        </div>
                    </div>

                    <div className="pedido-detalhe-section">
                        <h3>{t("orcamento.detalhe.object3d")}</h3>
                        {dadosOrcamento.objeto3DFileId ? (
                            <div className="pedido-arquivo-3d">
                                <span className="pedido-arquivo-icon"><File01Icon size={20} /></span>
                                <div>
                                    <strong>{t("orcamento.detalhe.object3dName")}</strong>
                                    <span>{t("orcamento.detalhe.object3dHint")}</span>
                                </div>
                                <button type="button" className="pedido-download-btn" onClick={handleDownloadObjeto3D} disabled={downloading}>
                                    <Download01Icon size={16} />
                                    {downloading ? t("orcamento.detalhe.downloading") : t("orcamento.detalhe.download")}
                                </button>
                            </div>
                        ) : (
                            <p className="pedido-detalhe-empty"><File01Icon size={16} /> {t("orcamento.detalhe.notAttached")}</p>
                        )}
                        {downloadError && <p className="pedido-download-error" role="alert">{downloadError}</p>}
                    </div>

                    <div className="pedido-detalhe-section">
                        <h3>{t("orcamento.detalhe.referenceImages")}</h3>
                        {dadosOrcamento.imagensReferenciaUrls?.length ? (
                            <div className="pedido-imagens-grid">
                                {dadosOrcamento.imagensReferenciaUrls.map((src, index) => (
                                    <button
                                        key={`${src}-${index}`}
                                        type="button"
                                        className="pedido-imagem-link"
                                        onClick={() => setZoomSrc(src)}
                                        aria-label={t("orcamento.detalhe.zoomImageAria", { index: index + 1 })}
                                    >
                                        <img src={src} alt={t("orcamento.detalhe.imageAlt", { index: index + 1, project: dadosOrcamento.projeto })} />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="pedido-detalhe-empty"><Image02Icon size={16} /> {t("orcamento.detalhe.noImages")}</p>
                        )}
                    </div>
                </div>
            </section>
        </div>
        </>
    );
}

export default OrcamentoDetalheModal;
