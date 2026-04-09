export type PedidoStatus = 'MODELAGEM' | 'IMPRESSAO' | 'PINTURA' | 'ACABAMENTO' | 'FINALIZADO';

export interface Pedido {
  id: string;
  cliente: string;
  projeto: string;
  descricao?: string;
  status: PedidoStatus;
  prazo: string;
}

export interface EventData {
  id: string;
  user_id: string;
  nome: string;
  data: string;
  descricao: string;
  startTime: string;
  endTime: string;
  participantes: string[];
  criado_em: Date | string;
  atualizado_em: Date | string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
}
