import { useEffect, useMemo, useState } from "react";
import { getPedidos } from "../services/PedidoService";
import { getOrdensPintura } from "../services/OrdemPinturaService";
import { Pedido, OrdemPintura } from "../types";

function inicioDoDia(data: Date = new Date()): number {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

export interface PedidoUrgente {
    pedido: Pedido;
    atrasado: boolean;
}

export interface OrdemUrgente {
    ordem: OrdemPintura;
    atrasada: boolean;
}

/**
 * Carrega pedidos e ordens de pintura e deriva o que precisa de atenção
 * (prazo vencido ou vencendo hoje). Alimenta o sino global da Sidebar.
 */
export function useNotificacoesUrgentes() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [ordens, setOrdens] = useState<OrdemPintura[]>([]);

    useEffect(() => {
        let ativo = true;
        Promise.allSettled([getPedidos(), getOrdensPintura()]).then(([p, o]) => {
            if (!ativo) return;
            if (p.status === "fulfilled") setPedidos(p.value);
            if (o.status === "fulfilled") setOrdens(o.value);
        });
        return () => { ativo = false; };
    }, []);

    const pedidosUrgentes = useMemo<PedidoUrgente[]>(() => {
        const hoje = inicioDoDia();
        const amanha = hoje + 24 * 60 * 60 * 1000;
        return pedidos
            .filter((p) => p.status !== "FINALIZADO" && new Date(p.prazo).getTime() < amanha)
            .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
            .map((pedido) => ({ pedido, atrasado: new Date(pedido.prazo).getTime() < hoje }));
    }, [pedidos]);

    const ordensUrgentes = useMemo<OrdemUrgente[]>(() => {
        const hoje = inicioDoDia();
        return ordens
            .filter((ordem) => ordem.etapa !== "FINALIZADO")
            .map((ordem) => ({ ordem, prazo: inicioDoDia(new Date(`${ordem.prazo.slice(0, 10)}T12:00:00`)) }))
            .filter(({ prazo }) => prazo <= hoje)
            .sort((a, b) => a.prazo - b.prazo)
            .map(({ ordem, prazo }) => ({ ordem, atrasada: prazo < hoje }));
    }, [ordens]);

    return { pedidosUrgentes, ordensUrgentes };
}
