import { useEffect, useState } from "react";
import { getToken, getUserRole } from "./useAuth";
import { buscarMeuConvite, type MeuConvite } from "../services/ConviteService";

/**
 * Convite de equipe pendente do usuário logado (SYN-101). Só cliente pode ser
 * convidado, então os outros papéis nem consultam. Falha na consulta não
 * bloqueia nada: o convite continua acessível pelo link do e-mail.
 */
export function useMeuConvite() {
    const [convite, setConvite] = useState<MeuConvite | null>(null);

    useEffect(() => {
        if (getUserRole() !== "CLIENTE") return;
        let ativo = true;
        buscarMeuConvite(getToken())
            .then((encontrado) => {
                if (ativo) setConvite(encontrado);
            })
            .catch(() => {});
        return () => {
            ativo = false;
        };
    }, []);

    return { convite, descartar: () => setConvite(null) };
}
