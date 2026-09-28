import { type FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Cancel01Icon } from "hugeicons-react";
import { FILTRO_ORCAMENTOS_VAZIO, type FiltroOrcamentos } from "../../services/OrcamentoService";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import IconButton from "../ui/IconButton";

interface OrcamentoFiltroModalProps {
    /** Título do modal (ex.: "Filtrar pendentes"). */
    titulo: string;
    /** Filtro em uso no bloco; o modal edita uma cópia e só devolve ao aplicar. */
    filtro: FiltroOrcamentos;
    onAplicar: (filtro: FiltroOrcamentos) => void;
    onClose: () => void;
}

/**
 * Filtro de orçamentos por cliente, projeto e período de criação. Cada bloco
 * (pendentes / histórico) abre o seu: fechar sem aplicar descarta a edição.
 */
function OrcamentoFiltroModal({ titulo, filtro, onAplicar, onClose }: OrcamentoFiltroModalProps) {
    const { t } = useTranslation();
    const painelRef = useRef<HTMLElement>(null);
    const [rascunho, setRascunho] = useState<FiltroOrcamentos>(filtro);

    useEscapeKey(onClose);
    useBodyScrollLock();
    useFocusTrap(painelRef);

    const datasInvertidas = rascunho.de !== "" && rascunho.ate !== "" && rascunho.de > rascunho.ate;

    function alterar(campo: keyof FiltroOrcamentos, valor: string) {
        setRascunho((atual) => ({ ...atual, [campo]: valor }));
    }

    function aplicar(event: FormEvent) {
        event.preventDefault();
        if (datasInvertidas) return;
        onAplicar({
            cliente: rascunho.cliente.trim(),
            projeto: rascunho.projeto.trim(),
            de: rascunho.de,
            ate: rascunho.ate,
        });
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <section
                ref={painelRef}
                className="modal-card orcamento-filtro-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="orcamento-filtro-titulo"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 id="orcamento-filtro-titulo">{titulo}</h2>
                    <IconButton variant="modal-close" onClick={onClose} aria-label={t("orcamento.historico.filterClose")}>
                        <Cancel01Icon size={18} />
                    </IconButton>
                </div>

                <form onSubmit={aplicar} noValidate>
                    <div className="orcamento-filtro-campos">
                        <div className="input-group">
                            <label htmlFor="orcamento-filtro-cliente">{t("orcamento.historico.filterClient")}</label>
                            <input
                                id="orcamento-filtro-cliente"
                                value={rascunho.cliente}
                                onChange={(e) => alterar("cliente", e.target.value)}
                                placeholder={t("orcamento.historico.filterClientPlaceholder")}
                                autoFocus
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="orcamento-filtro-projeto">{t("orcamento.historico.filterProject")}</label>
                            <input
                                id="orcamento-filtro-projeto"
                                value={rascunho.projeto}
                                onChange={(e) => alterar("projeto", e.target.value)}
                                placeholder={t("orcamento.historico.filterProjectPlaceholder")}
                            />
                        </div>
                        <div className="orcamento-filtro-datas">
                            <div className="input-group">
                                <label htmlFor="orcamento-filtro-de">{t("orcamento.historico.filterFrom")}</label>
                                <input
                                    id="orcamento-filtro-de"
                                    type="date"
                                    value={rascunho.de}
                                    max={rascunho.ate || undefined}
                                    onChange={(e) => alterar("de", e.target.value)}
                                    aria-invalid={datasInvertidas || undefined}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="orcamento-filtro-ate">{t("orcamento.historico.filterTo")}</label>
                                <input
                                    id="orcamento-filtro-ate"
                                    type="date"
                                    value={rascunho.ate}
                                    min={rascunho.de || undefined}
                                    onChange={(e) => alterar("ate", e.target.value)}
                                    aria-invalid={datasInvertidas || undefined}
                                />
                            </div>
                        </div>
                        {datasInvertidas && (
                            <p className="orcamento-filtros-erro" role="alert">{t("orcamento.historico.filterInvalidRange")}</p>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={() => onAplicar(FILTRO_ORCAMENTOS_VAZIO)}>
                            {t("orcamento.historico.filterClear")}
                        </button>
                        <button type="submit" className="button" disabled={datasInvertidas}>
                            {t("orcamento.historico.filterApply")}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default OrcamentoFiltroModal;
