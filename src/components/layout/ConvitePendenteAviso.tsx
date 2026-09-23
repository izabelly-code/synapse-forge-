import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserAdd01Icon } from "hugeicons-react";
import { getToken, getUserRole } from "../../hooks/useAuth";
import {
    aceitarMeuConvite,
    buscarMeuConvite,
    recusarMeuConvite,
    type MeuConvite,
} from "../../services/ConviteService";

type Acao = "aceitar" | "recusar";

/**
 * SYN-101: o convite de equipe também aparece dentro do app, no topo do conteúdo,
 * para quem está logado. Só cliente pode ser convidado, então os outros papéis
 * nem consultam.
 */
function ConvitePendenteAviso() {
    const { t } = useTranslation();
    const [convite, setConvite] = useState<MeuConvite | null>(null);
    const [acao, setAcao] = useState<Acao | null>(null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (getUserRole() !== "CLIENTE") return;
        let ativo = true;
        buscarMeuConvite(getToken())
            .then((encontrado) => {
                if (ativo) setConvite(encontrado);
            })
            .catch(() => {
                // Falha ao consultar não bloqueia o app: o convite segue disponível pelo e-mail.
            });
        return () => {
            ativo = false;
        };
    }, []);

    if (!convite) return null;

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
            setErro(t("equipe.inviteBanner.error"));
            setAcao(null);
        }
    }

    async function recusar() {
        setAcao("recusar");
        setErro("");
        try {
            await recusarMeuConvite(getToken());
            setConvite(null);
        } catch {
            setErro(t("equipe.inviteBanner.error"));
        } finally {
            setAcao(null);
        }
    }

    return (
        <section className="convite-aviso" aria-labelledby="convite-aviso-titulo">
            <span className="convite-aviso-icone" aria-hidden="true">
                <UserAdd01Icon size={20} />
            </span>

            <div className="convite-aviso-texto">
                <p id="convite-aviso-titulo" className="convite-aviso-titulo">
                    {t("equipe.inviteBanner.title", {
                        gerente: convite.gerenteNome ?? t("equipe.inviteBanner.someone"),
                        equipe: convite.equipeNome ?? "",
                    })}
                </p>
                <p className="convite-aviso-descricao">
                    {erro || t("equipe.inviteBanner.description")}
                </p>
            </div>

            <div className="convite-aviso-acoes">
                <button
                    type="button"
                    className="convite-aviso-btn"
                    onClick={recusar}
                    disabled={acao !== null}
                >
                    {acao === "recusar" ? t("equipe.inviteBanner.declining") : t("equipe.inviteBanner.decline")}
                </button>
                <button
                    type="button"
                    className="convite-aviso-btn convite-aviso-btn-primario"
                    onClick={aceitar}
                    disabled={acao !== null}
                >
                    {acao === "aceitar" ? t("equipe.inviteBanner.accepting") : t("equipe.inviteBanner.accept")}
                </button>
            </div>
        </section>
    );
}

export default ConvitePendenteAviso;
