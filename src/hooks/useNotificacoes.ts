import { useEffect, useState } from "react";
import { getNotificacoes, marcarNotificacaoComoLida, type Notificacao } from "../services/NotificacaoService";
import { useRecarregarAoVoltar } from "./useRecarregarAoVoltar";

/** Com a aba aberta e visível, busca avisos novos a cada minuto. */
const INTERVALO_POLLING_MS = 60_000;

/**
 * Notificações persistidas e ainda não lidas do usuário logado (ex.: pedido
 * finalizado). Alimenta o sino da Sidebar junto com os prazos urgentes.
 * Falha na consulta não bloqueia nada: o sino só fica sem esses itens.
 */
export function useNotificacoes() {
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [recarga, setRecarga] = useState(0);
    useRecarregarAoVoltar(() => setRecarga((n) => n + 1));

    useEffect(() => {
        const timer = setInterval(() => {
            if (document.visibilityState === "visible") setRecarga((n) => n + 1);
        }, INTERVALO_POLLING_MS);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let ativo = true;
        getNotificacoes(true)
            .then((lista) => {
                if (ativo) setNotificacoes(lista);
            })
            .catch(() => {});
        return () => {
            ativo = false;
        };
    }, [recarga]);

    /** Tira do sino na hora; se o backend falhar, o item volta na próxima recarga. */
    function marcarComoLida(id: string) {
        setNotificacoes((atuais) => atuais.filter((n) => n.id !== id));
        marcarNotificacaoComoLida(id).catch(() => {});
    }

    return { notificacoes, marcarComoLida };
}
