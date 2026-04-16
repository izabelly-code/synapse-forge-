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
  userId: string;
  nome: string;
  data: string;
  descricao: string;
  horarioInicio: string;
  horarioFim: string;
  participantes: string[];
}

export interface User {
  id: string;
  nome: string;
  email: string;
}
