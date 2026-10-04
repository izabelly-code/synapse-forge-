const API_URL = "http://localhost:8081/notificacoes";

export type TipoNotificacao = "PEDIDO_FINALIZADO" | "ORDEM_PINTURA_ATRIBUIDA" | "PEDIDO_ETAPA_ALTERADA";

/** Aviso persistido do usuário logado. O texto é montado no front a partir do tipo. */
export interface Notificacao {
    id: string;
    tipo: TipoNotificacao;
    /** Registro de origem (ex.: id do pedido finalizado). */
    referenciaId: string | null;
    /** Texto principal (ex.: nome do projeto). */
    titulo: string | null;
    /** Complemento da frase; no aviso de etapa é o código da etapa nova (ex.: "PINTURA"). */
    detalhe: string | null;
    lida: boolean;
    criadaEm: string;
}

function headers(): Record<string, string> {
    return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export async function getNotificacoes(apenasNaoLidas = true): Promise<Notificacao[]> {
    const response = await fetch(`${API_URL}?naoLidas=${apenasNaoLidas}`, { headers: headers() });
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
}

export async function marcarNotificacaoComoLida(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}/lida`, { method: "PATCH", headers: headers() });
    if (!response.ok) throw new Error(await response.text());
}

export async function marcarTodasNotificacoesComoLidas(): Promise<void> {
    const response = await fetch(`${API_URL}/lidas`, { method: "PATCH", headers: headers() });
    if (!response.ok) throw new Error(await response.text());
}
