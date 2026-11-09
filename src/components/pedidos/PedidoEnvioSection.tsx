import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DeliveryTruck01Icon, LinkSquare02Icon, PackageIcon } from "hugeicons-react";

import { FormaEnvio, Pedido, PedidoEnvioInput, STATUS_ENVIO, StatusEnvio } from "../../types";
import { getFormasEnvio } from "../../services/FormaEnvioService";
import { registrarEnvio } from "../../services/PedidoService";
import Select from "../ui/Select";
import { cn } from "../../utils/cn";
import { formatDate } from "../../utils/format";

interface PedidoEnvioSectionProps {
    pedido: Pedido;
    /** TECNICO/GERENTE/ADMIN editam; CLIENTE só acompanha. */
    podeEditar: boolean;
    onUpdated?: (pedido: Pedido) => void;
}

/** Data `yyyy-MM-dd` do back; meio-dia evita voltar um dia pelo fuso. */
function formatDataCurta(iso: string | null | undefined): string {
    if (!iso) return "—";
    const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return formatDate(date, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusChipClass(status: StatusEnvio): string {
    if (status === "ENTREGUE") return "chip-done";
    if (status === "PREPARANDO") return "chip-neutral";
    return "chip-active";
}

/**
 * RF15: bloco "Envio" do detalhe do pedido. Forma de envio vem da coleção auxiliar
 * (GET /formas-envio); o link de rastreio já chega montado do back.
 */
function PedidoEnvioSection({ pedido, podeEditar, onUpdated }: PedidoEnvioSectionProps) {
    const { t } = useTranslation();

    const statusAtual: StatusEnvio = pedido.statusEnvio ?? "PREPARANDO";
    const temEnvio = !!(pedido.formaEnvioId || pedido.codigoRastreio || pedido.dataPostagem || pedido.previsaoEntrega);

    const [formas, setFormas] = useState<FormaEnvio[]>([]);
    const [carregandoFormas, setCarregandoFormas] = useState(false);
    const [erroFormas, setErroFormas] = useState("");

    const [formaEnvioId, setFormaEnvioId] = useState(pedido.formaEnvioId ?? "");
    const [codigoRastreio, setCodigoRastreio] = useState(pedido.codigoRastreio ?? "");
    const [dataPostagem, setDataPostagem] = useState(pedido.dataPostagem?.slice(0, 10) ?? "");
    const [previsaoEntrega, setPrevisaoEntrega] = useState(pedido.previsaoEntrega?.slice(0, 10) ?? "");
    const [statusEnvio, setStatusEnvio] = useState<StatusEnvio>(pedido.statusEnvio ?? "PREPARANDO");

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [salvo, setSalvo] = useState(false);

    // O formulário reflete o pedido carregado (inclusive o que voltou do PATCH): quando
    // a prop muda, o estado é ajustado ainda na renderização, sem efeito intermediário.
    const [pedidoSincronizado, setPedidoSincronizado] = useState(pedido);
    if (pedidoSincronizado !== pedido) {
        setPedidoSincronizado(pedido);
        setFormaEnvioId(pedido.formaEnvioId ?? "");
        setCodigoRastreio(pedido.codigoRastreio ?? "");
        setDataPostagem(pedido.dataPostagem?.slice(0, 10) ?? "");
        setPrevisaoEntrega(pedido.previsaoEntrega?.slice(0, 10) ?? "");
        setStatusEnvio(pedido.statusEnvio ?? "PREPARANDO");
    }

    useEffect(() => {
        if (!podeEditar) return;
        let active = true;

        async function fetchFormas() {
            setCarregandoFormas(true);
            setErroFormas("");
            try {
                const data = await getFormasEnvio();
                if (active) setFormas(data);
            } catch {
                if (active) setErroFormas(t("pedidos.envio.formaLoadError"));
            } finally {
                if (active) setCarregandoFormas(false);
            }
        }

        fetchFormas();
        return () => { active = false; };
    }, [podeEditar, t]);

    const formaSelecionada = formas.find((f) => f.id === formaEnvioId);
    // forma do pedido que não está mais na lista (inativada): continua visível no select
    const opcoesFormas = [
        { value: "", label: carregandoFormas ? t("pedidos.envio.formaLoading") : t("pedidos.envio.formaNone") },
        ...formas.map((f) => ({ value: f.id, label: f.transportadora ? `${f.nome} — ${f.transportadora}` : f.nome })),
        ...(formaEnvioId && !formaSelecionada && pedido.formaEnvioNome && formaEnvioId === pedido.formaEnvioId
            ? [{ value: formaEnvioId, label: pedido.formaEnvioNome }]
            : []),
    ];

    const formaSemRastreio = !!formaSelecionada && !formaSelecionada.urlRastreioTemplate;

    async function handleSalvar(e: React.FormEvent) {
        e.preventDefault();
        if (salvando) return;
        setSalvando(true);
        setErro("");
        setSalvo(false);

        const dados: PedidoEnvioInput = {
            formaEnvioId: formaEnvioId || null,
            codigoRastreio: codigoRastreio.trim() || null,
            dataPostagem: dataPostagem || null,
            previsaoEntrega: previsaoEntrega || null,
            // PREPARANDO sem código é o padrão do back; só o que o usuário marcou além disso é enviado
            statusEnvio: statusEnvio === "PREPARANDO" && !codigoRastreio.trim() ? null : statusEnvio,
        };

        try {
            const atualizado = await registrarEnvio(pedido.id, dados);
            setSalvo(true);
            onUpdated?.(atualizado);
        } catch (err) {
            setErro(err instanceof Error && err.message && !/^Falha/.test(err.message)
                ? err.message
                : t("pedidos.envio.errorSave"));
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="pedido-detalhe-section pedido-envio-section">
            <div className="pedido-envio-header">
                <h3>{t("pedidos.envio.title")}</h3>
                <span className={cn("pedido-chip", statusChipClass(statusAtual))}>
                    <DeliveryTruck01Icon size={14} aria-hidden="true" />
                    {t(`pedidos.statusEnvio.${statusAtual}`)}
                </span>
            </div>

            {temEnvio ? (
                <div className="pedido-orcamento-detalhe-grid">
                    <div><span>{t("pedidos.envio.formaLabel")}</span><strong>{pedido.formaEnvioNome || "—"}</strong></div>
                    <div><span>{t("pedidos.envio.trackingCodeLabel")}</span><strong>{pedido.codigoRastreio || "—"}</strong></div>
                    <div><span>{t("pedidos.envio.postedAtLabel")}</span><strong>{formatDataCurta(pedido.dataPostagem)}</strong></div>
                    <div><span>{t("pedidos.envio.etaLabel")}</span><strong>{formatDataCurta(pedido.previsaoEntrega)}</strong></div>
                </div>
            ) : (
                <p className="pedido-detalhe-empty"><PackageIcon size={16} /> {t("pedidos.envio.empty")}</p>
            )}

            {pedido.linkRastreio && (
                <a
                    className="pedido-download-btn pedido-envio-link"
                    href={pedido.linkRastreio}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <LinkSquare02Icon size={16} />
                    {t("pedidos.envio.trackLink")}
                </a>
            )}

            {podeEditar && (
                <form className="pedido-envio-form" onSubmit={handleSalvar}>
                    <div className="pedido-edit-grid">
                        <div className="input-group">
                            <label htmlFor="pedido-envio-forma">{t("pedidos.envio.formaLabel")}</label>
                            <Select
                                id="pedido-envio-forma"
                                value={formaEnvioId}
                                onChange={(value) => { setFormaEnvioId(value); setSalvo(false); }}
                                options={opcoesFormas}
                                disabled={carregandoFormas || salvando}
                                placeholder={t("pedidos.envio.formaPlaceholder")}
                            />
                            <span className="input-hint">
                                {erroFormas
                                    ? <span className="error-text">{erroFormas}</span>
                                    : formaSemRastreio ? t("pedidos.envio.noTracking") : ""}
                            </span>
                        </div>
                        <div className="input-group">
                            <label htmlFor="pedido-envio-codigo">{t("pedidos.envio.trackingCodeLabel")}</label>
                            <input
                                id="pedido-envio-codigo"
                                value={codigoRastreio}
                                onChange={(e) => { setCodigoRastreio(e.target.value); setSalvo(false); }}
                                placeholder={t("pedidos.envio.trackingCodePlaceholder")}
                                disabled={salvando}
                                autoComplete="off"
                            />
                            <span className="input-hint">{t("pedidos.envio.trackingCodeHint")}</span>
                        </div>
                        <div className="input-group">
                            <label htmlFor="pedido-envio-postagem">{t("pedidos.envio.postedAtLabel")}</label>
                            <input
                                id="pedido-envio-postagem"
                                type="date"
                                value={dataPostagem}
                                onChange={(e) => { setDataPostagem(e.target.value); setSalvo(false); }}
                                disabled={salvando}
                            />
                            <span className="input-hint" />
                        </div>
                        <div className="input-group">
                            <label htmlFor="pedido-envio-previsao">{t("pedidos.envio.etaLabel")}</label>
                            <input
                                id="pedido-envio-previsao"
                                type="date"
                                value={previsaoEntrega}
                                onChange={(e) => { setPrevisaoEntrega(e.target.value); setSalvo(false); }}
                                disabled={salvando}
                            />
                            <span className="input-hint" />
                        </div>
                        <div className="input-group">
                            <label htmlFor="pedido-envio-status">{t("pedidos.envio.statusLabel")}</label>
                            <Select
                                id="pedido-envio-status"
                                value={statusEnvio}
                                onChange={(value) => { setStatusEnvio(value as StatusEnvio); setSalvo(false); }}
                                options={STATUS_ENVIO.map((s) => ({ value: s, label: t(`pedidos.statusEnvio.${s}`) }))}
                                disabled={salvando}
                            />
                            <span className="input-hint">{t("pedidos.envio.statusHint")}</span>
                        </div>
                    </div>

                    {erro && <p className="pedido-edit-error" role="alert">{erro}</p>}

                    <div className="pedido-envio-actions">
                        {salvo && !erro && <span className="pedido-envio-saved" role="status">{t("pedidos.envio.saved")}</span>}
                        <button type="submit" className="button" disabled={salvando}>
                            {salvando ? t("pedidos.envio.saving") : t("pedidos.envio.save")}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default PedidoEnvioSection;
