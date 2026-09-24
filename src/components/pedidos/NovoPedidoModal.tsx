import { useEffect, useMemo, useRef, useState } from "react";
import { Add01Icon, Cancel01Icon, File01Icon, Image02Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { criarPedido } from "../../services/PedidoService";
import { buscarClientePorEmail, getClientes } from "../../services/UserService";
import type { User } from "../../types";
import ImageLightbox from "../ui/ImageLightbox";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import IconButton from "../ui/IconButton";
import LoadingButton from "../ui/LoadingButton";
import Select from "../ui/Select";
import { hojeISO } from "../../utils/format";

interface NovoPedidoModalProps {
    onClose: () => void;
    onCriado: () => void;
}

type CampoErro = "cliente" | "projeto" | "prazo";
type Erros = Partial<Record<CampoErro, string>>;

// Opções fixas do campo mock "Canal de origem" (ainda sem backend).
const CANAIS_ORIGEM = ["whatsapp", "instagram", "loja", "indicacao"] as const;

function NovoPedidoModal({ onClose, onCriado }: NovoPedidoModalProps) {
    const { t } = useTranslation();
    const [clientes, setClientes] = useState<User[]>([]);
    const [carregandoClientes, setCarregandoClientes] = useState(true);
    const [erroClientes, setErroClientes] = useState("");
    const [clienteId, setClienteId] = useState("");
    const [emailBusca, setEmailBusca] = useState("");
    const [buscandoEmail, setBuscandoEmail] = useState(false);
    const [avisoBusca, setAvisoBusca] = useState("");
    const [cliente, setCliente] = useState("");
    const [projeto, setProjeto] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prazo, setPrazo] = useState("");
    // Campo só de mock: fica no estado local e NÃO vai no payload do criarPedido.
    const [canalOrigem, setCanalOrigem] = useState("");
    const [materialId, setMaterialId] = useState("");
    const [volumeCm3, setVolumeCm3] = useState("");
    const [tempoImpressaoHoras, setTempoImpressaoHoras] = useState("");
    const [tempoMaoDeObraHoras, setTempoMaoDeObraHoras] = useState("");
    const [custoMaquinaHora, setCustoMaquinaHora] = useState("");
    const [custoMaoDeObraHora, setCustoMaoDeObraHora] = useState("");
    const [margemLucro, setMargemLucro] = useState("");
    const [custoMaterial, setCustoMaterial] = useState("");
    const [custoMaquina, setCustoMaquina] = useState("");
    const [custoMaoDeObra, setCustoMaoDeObra] = useState("");
    const [custoTotal, setCustoTotal] = useState("");
    const [precoFinal, setPrecoFinal] = useState("");
    const [objeto3D, setObjeto3D] = useState<File | null>(null);
    const [imagensReferencia, setImagensReferencia] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [erros, setErros] = useState<Erros>({});
    const [erroEnvio, setErroEnvio] = useState("");
    const [zoomSrc, setZoomSrc] = useState<string | null>(null);

    const projetoRef = useRef<HTMLInputElement>(null);
    const prazoRef = useRef<HTMLInputElement>(null);
    const painelRef = useRef<HTMLElement>(null);

    const hoje = hojeISO();

    useEscapeKey(onClose);
    useBodyScrollLock();
    useFocusTrap(painelRef);

    // SYN-100: a lista traz os clientes que já têm pedido nesta equipe. Cliente novo
    // para a loja entra pela busca por e-mail exato logo abaixo do select.
    useEffect(() => {
        // `carregandoClientes` já nasce true e `erroClientes` vazio no useState,
        // então o effect não precisa (nem deve) setar estado de forma síncrona.
        const token = localStorage.getItem("token");
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

    async function buscarPorEmail() {
        const email = emailBusca.trim();
        if (!email) return;
        setBuscandoEmail(true);
        setAvisoBusca("");
        try {
            const encontrado = await buscarClientePorEmail(email, localStorage.getItem("token"));
            if (!encontrado) {
                setAvisoBusca(t("pedidos.form.clientNotFound"));
                return;
            }
            setClientes((atual) =>
                atual.some((usuario) => usuario.id === encontrado.id)
                    ? atual
                    : [...atual, { ...encontrado, role: "CLIENTE" }]
            );
            setClienteId(encontrado.id);
            setCliente(encontrado.nome);
            limparErro("cliente");
            setEmailBusca("");
        } catch {
            setAvisoBusca(t("pedidos.form.errorSearchClient"));
        } finally {
            setBuscandoEmail(false);
        }
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
            materialId: materialId.trim() || undefined,
            volumeCm3: volumeCm3 ? Number(volumeCm3) : undefined,
            tempoImpressaoHoras: tempoImpressaoHoras ? Number(tempoImpressaoHoras) : undefined,
            tempoMaoDeObraHoras: tempoMaoDeObraHoras ? Number(tempoMaoDeObraHoras) : undefined,
            custoMaquinaHora: custoMaquinaHora ? Number(custoMaquinaHora) : undefined,
            custoMaoDeObraHora: custoMaoDeObraHora ? Number(custoMaoDeObraHora) : undefined,
            margemLucro: margemLucro ? Number(margemLucro) : undefined,
            custoMaterial: custoMaterial ? Number(custoMaterial) : undefined,
            custoMaquina: custoMaquina ? Number(custoMaquina) : undefined,
            custoMaoDeObra: custoMaoDeObra ? Number(custoMaoDeObra) : undefined,
            custoTotal: custoTotal ? Number(custoTotal) : undefined,
            precoFinal: precoFinal ? Number(precoFinal) : undefined,
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
                            {/* Select próprio no lugar do <select> nativo: o painel do sistema
                                fugia do tema e da tipografia do app (e no celular abria um menu
                                nativo minúsculo). */}
                            <Select
                                id="cliente"
                                value={clienteId}
                                onChange={handleClienteChange}
                                invalid={!!erros.cliente}
                                describedBy={erros.cliente ? "cliente-erro" : undefined}
                                disabled={carregandoClientes}
                                options={[
                                    {
                                        value: "",
                                        label: carregandoClientes ? t("pedidos.form.loadingClients") : t("pedidos.form.noClientLinked"),
                                    },
                                    ...(carregandoClientes
                                        ? []
                                        : clientes.map((usuario) => ({ value: String(usuario.id), label: `${usuario.nome} — ${usuario.email}` }))),
                                ]}
                            />
                            {erroClientes && <span className="error-text">{erroClientes}</span>}
                            <div className="cliente-busca-email">
                                <input
                                    id="cliente-email"
                                    type="email"
                                    value={emailBusca}
                                    onChange={(e) => { setEmailBusca(e.target.value); setAvisoBusca(""); }}
                                    onKeyDown={(e) => {
                                        // Enter aqui busca o cliente, não envia o pedido inteiro.
                                        if (e.key === "Enter") { e.preventDefault(); buscarPorEmail(); }
                                    }}
                                    placeholder={t("pedidos.form.clientEmailPlaceholder")}
                                    aria-label={t("pedidos.form.clientEmailPlaceholder")}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    className="cliente-busca-btn"
                                    onClick={buscarPorEmail}
                                    disabled={buscandoEmail || !emailBusca.trim()}
                                >
                                    {buscandoEmail ? t("pedidos.form.searchingClient") : t("pedidos.form.searchClient")}
                                </button>
                            </div>
                            {avisoBusca && <span className="input-hint" role="status">{avisoBusca}</span>}
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

                        <div className="input-group">
                            <label htmlFor="canal-origem">{t("pedidos.form.originLabel")}</label>
                            <Select
                                id="canal-origem"
                                value={canalOrigem}
                                onChange={setCanalOrigem}
                                describedBy="canal-origem-hint"
                                options={[
                                    { value: "", label: t("pedidos.form.originNone") },
                                    ...CANAIS_ORIGEM.map((canal) => ({
                                        value: canal,
                                        label: t(`pedidos.form.originOptions.${canal}`),
                                    })),
                                ]}
                            />
                            <span className="input-hint" id="canal-origem-hint">{t("pedidos.form.originHint")}</span>
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

                    <fieldset className="pedido-orcamento-fields">
                        <div className="pedido-edit-grid">
                            <div className="input-group"><label htmlFor="pedido-material">ID do material</label><input id="pedido-material" value={materialId} onChange={(e) => setMaterialId(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-volume">Volume (cm³)</label><input id="pedido-volume" type="number" min="0" step="0.01" value={volumeCm3} onChange={(e) => setVolumeCm3(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-impressao">Impressão (h)</label><input id="pedido-impressao" type="number" min="0" step="0.1" value={tempoImpressaoHoras} onChange={(e) => setTempoImpressaoHoras(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-mao-obra">Mão de obra (h)</label><input id="pedido-mao-obra" type="number" min="0" step="0.1" value={tempoMaoDeObraHoras} onChange={(e) => setTempoMaoDeObraHoras(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-maquina">Custo máquina/h</label><input id="pedido-maquina" type="number" min="0" step="0.01" value={custoMaquinaHora} onChange={(e) => setCustoMaquinaHora(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-mao-obra-custo">Custo mão de obra/h</label><input id="pedido-mao-obra-custo" type="number" min="0" step="0.01" value={custoMaoDeObraHora} onChange={(e) => setCustoMaoDeObraHora(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-margem">Margem de lucro (%)</label><input id="pedido-margem" type="number" min="0" step="0.1" value={margemLucro} onChange={(e) => setMargemLucro(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-custo-material">Custo material</label><input id="pedido-custo-material" type="number" min="0" step="0.01" value={custoMaterial} onChange={(e) => setCustoMaterial(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-custo-maquina">Custo máquina</label><input id="pedido-custo-maquina" type="number" min="0" step="0.01" value={custoMaquina} onChange={(e) => setCustoMaquina(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-custo-mao-obra">Custo mão de obra</label><input id="pedido-custo-mao-obra" type="number" min="0" step="0.01" value={custoMaoDeObra} onChange={(e) => setCustoMaoDeObra(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-custo-total">Custo total</label><input id="pedido-custo-total" type="number" min="0" step="0.01" value={custoTotal} onChange={(e) => setCustoTotal(e.target.value)} /></div>
                            <div className="input-group"><label htmlFor="pedido-preco-final">Preço final</label><input id="pedido-preco-final" type="number" min="0" step="0.01" value={precoFinal} onChange={(e) => setPrecoFinal(e.target.value)} /></div>
                        </div>
                    </fieldset>

                    <div className="input-group">
                        <label htmlFor="objeto3D">
                            Upload do objeto 3D
                        </label>
                        <input
                            id="objeto3D"
                            type="file"
                            accept=".stl,.obj,.fbx,.glb,.gltf,.3mf"
                            onChange={(e) => setObjeto3D(e.target.files?.[0] ?? null)}
                        />
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
