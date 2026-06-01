export type PedidoStatus = 'MODELAGEM' | 'IMPRESSAO' | 'PINTURA' | 'ACABAMENTO' | 'FINALIZADO';

export interface Pedido {
  id: string;
  cliente: string;
  projeto: string;
  descricao?: string;
  status: PedidoStatus;
  prazo: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface EventData {
  id: string;
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

export type Acabamento = 'FOSCO' | 'BRILHANTE' | 'METALICO' | 'CETIM';

export interface Cor {
  id: string;
  nome: string;
  fornecedor: string;
  codigo?: string;
  hex: string;
  acabamento: Acabamento;
  estoqueMl: number;
  estoqueMinimoMl: number;
  custoMl: number;
  criadoEm?: string;
}
