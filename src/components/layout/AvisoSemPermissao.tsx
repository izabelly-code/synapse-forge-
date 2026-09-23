import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EVENTO_SEM_PERMISSAO } from "../../services/httpInterceptor";

const DURACAO_MS = 4000;

/** Aviso passageiro quando o back responde 403 a uma ação (sem deslogar a pessoa). */
function AvisoSemPermissao() {
    const { t } = useTranslation();
    const [visivel, setVisivel] = useState(false);

    useEffect(() => {
        let timer: number | undefined;
        function mostrar() {
            setVisivel(true);
            window.clearTimeout(timer);
            timer = window.setTimeout(() => setVisivel(false), DURACAO_MS);
        }
        window.addEventListener(EVENTO_SEM_PERMISSAO, mostrar);
        return () => {
            window.removeEventListener(EVENTO_SEM_PERMISSAO, mostrar);
            window.clearTimeout(timer);
        };
    }, []);

    return (
        <div className="aviso-global" role="status" aria-live="polite">
            {visivel && <p className="aviso-global-texto">{t("avisos.semPermissao")}</p>}
        </div>
    );
}

export default AvisoSemPermissao;
