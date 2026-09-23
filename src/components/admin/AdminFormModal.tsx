import { useRef, type FormEvent, type ReactNode } from "react";
import { Cancel01Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";

import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import IconButton from "../ui/IconButton";
import LoadingButton from "../ui/LoadingButton";

interface AdminFormModalProps {
    id: string;
    kicker: string;
    titulo: string;
    descricao: string;
    erro: string | null;
    salvando: boolean;
    onClose: () => void;
    onSubmit: () => void;
    children: ReactNode;
}

/** Casca comum dos modais de edição do painel Admin: overlay, cabeçalho, erro e rodapé Cancelar/Salvar. */
function AdminFormModal({ id, kicker, titulo, descricao, erro, salvando, onClose, onSubmit, children }: AdminFormModalProps) {
    const { t } = useTranslation();
    const painelRef = useRef<HTMLElement>(null);

    // Fechar no meio do salvamento deixaria a requisição órfã.
    const fechar = () => {
        if (!salvando) onClose();
    };

    useEscapeKey(fechar);
    useBodyScrollLock();
    useFocusTrap(painelRef);

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        onSubmit();
    }

    return (
        <div
            className="modal-overlay"
            role="presentation"
            // mousedown, não click: arrastar a seleção de texto para fora não fecha o modal
            onMouseDown={(event) => event.target === event.currentTarget && fechar()}
        >
            <section ref={painelRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby={id}>
                <div className="modal-header">
                    <div>
                        <span className="pedido-detalhe-kicker">{kicker}</span>
                        <h2 id={id}>{titulo}</h2>
                        <p className="dashboard-subtitle">{descricao}</p>
                    </div>
                    <IconButton variant="modal-close" onClick={fechar} disabled={salvando} aria-label={t("admin.actions.cancel")}>
                        <Cancel01Icon size={18} />
                    </IconButton>
                </div>

                <form className="pedido-edit-form" onSubmit={handleSubmit} noValidate>
                    {erro && (
                        <p className="pedido-edit-error" role="alert">
                            {erro}
                        </p>
                    )}

                    {children}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={fechar} disabled={salvando}>
                            {t("admin.actions.cancel")}
                        </button>
                        <LoadingButton type="submit" className="button" pending={salvando} pendingLabel={t("admin.actions.saving")}>
                            {t("admin.actions.save")}
                        </LoadingButton>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default AdminFormModal;
