import { useEffect, useState } from "react";
import { getToken, getUserRole } from "./useAuth";
import { buscarMeuConvite, type MeuConvite } from "../services/ConviteService";
import { useRecarregarAoVoltar } from "./useRecarregarAoVoltar";

/**
 * Convite de equipe pendente do usuário logado (SYN-101). Só cliente pode ser
 * convidado, então os outros papéis nem consultam. Falha na consulta não
 * bloqueia nada: o convite continua acessível pelo link do e-mail.
 */
export function useMeuConvite() {
    const [convite, setConvite] = useState<MeuConvite | null>(null);
    // Convite novo aparece no sino quando a pessoa volta para a aba.
    const [recarga, setRecarga] = useState(0);
    useRecarregarAoVoltar(() => setRecarga((n) => n + 1));

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
    }, [recarga]);

    return { convite, descartar: () => setConvite(null) };
}
