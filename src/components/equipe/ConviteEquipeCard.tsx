import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Cancel01Icon, UserGroupIcon } from "hugeicons-react";
import { getToken } from "../../hooks/useAuth";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { aceitarMeuConvite, recusarMeuConvite, type MeuConvite } from "../../services/ConviteService";
import { formatDate } from "../../utils/format";
import IconButton from "../ui/IconButton";

interface ConviteEquipeCardProps {
    convite: MeuConvite;
    onClose: () => void;
    /** Recusado com sucesso: quem abriu some com o item do sino. */
    onRecusado: () => void;
}

type Acao = "aceitar" | "recusar";

/**
 * SYN-101: o convite aberto a partir do sino. Mostra a equipe como ela aparece
 * na página de Equipe (banner, foto, nome) para a pessoa decidir sabendo onde entra.
 * Vai por portal para o body: a sidebar vira gaveta com transform no celular, e um
 * `position: fixed` dentro dela ficaria preso à gaveta.
 */
function ConviteEquipeCard({ convite, onClose, onRecusado }: ConviteEquipeCardProps) {
    const { t } = useTranslation();
    const painelRef = useRef<HTMLDivElement>(null);
    const [acao, setAcao] = useState<Acao | null>(null);
    const [erro, setErro] = useState("");

    useEscapeKey(() => {
        if (!acao) onClose();
    });
    useBodyScrollLock();
    useFocusTrap(painelRef);

    const nomeEquipe = convite.equipe?.nome ?? convite.convite.equipeNome ?? "";
    const gerente = convite.convite.gerenteNome ?? t("equipe.inviteCard.someone");

    async function aceitar() {
        setAcao("aceitar");
        setErro("");
        try {
            const { access_token, user_id } = await aceitarMeuConvite(getToken());
            localStorage.setItem("token", access_token);
            localStorage.setItem("userId", user_id);
            // Recarrega de verdade: vários pontos do app leem o papel do token ao montar.
            window.location.assign("/equipe");
        } catch {
            setErro(t("equipe.inviteCard.error"));
            setAcao(null);
        }
    }

    async function recusar() {
        setAcao("recusar");
        setErro("");
        try {
            await recusarMeuConvite(getToken());
            onRecusado();
        } catch {
            setErro(t("equipe.inviteCard.error"));
            setAcao(null);
        }
    }

    return createPortal(
        <div
            className="modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !acao) onClose();
            }}
        >
            <div
                ref={painelRef}
                className="modal-card convite-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="convite-card-titulo"
            >
                <div className="convite-card-banner">
                    {convite.equipe?.bannerBase64 && (
                        <img src={convite.equipe.bannerBase64} alt="" />
                    )}
                    <IconButton
                        variant="modal-close"
                        className="convite-card-fechar"
                        onClick={onClose}
                        disabled={acao !== null}
                        aria-label={t("equipe.inviteCard.close")}
                    >
                        <Cancel01Icon size={18} />
                    </IconButton>
                </div>

                <div className="convite-card-corpo">
                    <div className="convite-card-foto" aria-hidden="true">
                        {convite.equipe?.fotoBase64 ? (
                            <img src={convite.equipe.fotoBase64} alt="" />
                        ) : (
                            <UserGroupIcon size={28} />
                        )}
                    </div>

                    <p className="convite-card-rotulo">{t("equipe.inviteCard.label")}</p>
                    <h2 id="convite-card-titulo" className="convite-card-nome">{nomeEquipe}</h2>
                    <p className="convite-card-texto">
                        {t("equipe.inviteCard.invitedBy", { gerente })}
                    </p>
                    <p className="convite-card-detalhe">
                        {erro || t("equipe.inviteCard.description")}
                        {!erro && convite.convite.expiraEm && (
                            <>
                                {" "}
                                {t("equipe.inviteCard.expires", {
                                    data: formatDate(convite.convite.expiraEm, {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                    }),
                                })}
                            </>
                        )}
                    </p>

                    <div className="convite-card-acoes">
                        <button
                            type="button"
                            className="convite-card-btn"
                            onClick={recusar}
                            disabled={acao !== null}
                        >
                            {acao === "recusar" ? t("equipe.inviteCard.declining") : t("equipe.inviteCard.decline")}
                        </button>
                        <button
                            type="button"
                            className="convite-card-btn convite-card-btn-primario"
                            onClick={aceitar}
                            disabled={acao !== null}
                        >
                            {acao === "aceitar" ? t("equipe.inviteCard.accepting") : t("equipe.inviteCard.accept")}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ConviteEquipeCard;
