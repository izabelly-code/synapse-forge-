export type PedidoStatus = 'MODELAGEM' | 'IMPRESSAO' | 'PINTURA' | 'ACABAMENTO' | 'FINALIZADO';

export interface Pedido {
  id: string;
  cliente: string;
  projeto: string;
  descricao?: string;
  orcamentoId?: string;
  materialId?: string;
  volumeCm3?: number;
  tempoImpressaoHoras?: number;
  tempoMaoDeObraHoras?: number;
  custoMaquinaHora?: number;
  custoMaoDeObraHora?: number;
  margemLucro?: number;
  custoMaterial?: number;
  custoMaquina?: number;
  custoMaoDeObra?: number;
  custoTotal?: number;
  precoFinal?: number;
  objeto3DFileId?: string;
  imagensReferenciaFileIds?: string[];
  imagensReferenciaIds?: string[];
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
  role?: 'ADMIN' | 'GERENTE' | 'TECNICO' | 'CLIENTE';
}

export type EtapaOrdemPintura =
  | 'AGUARDANDO'
  | 'MISTURANDO_TINTA'
  | 'EM_PINTURA'
  | 'SECANDO'
  | 'FINALIZADO'
  | 'RETRABALHO';

export type PrioridadeOrdemPintura = 'BAIXA' | 'MEDIA' | 'ALTA';

export interface OrdemPintura {
  id: string;
  pedidoId: string;
  pedidoProjeto: string;
  pedidoCliente: string;
  corId: string;
  corNome: string;
  corHex: string;
  acabamento?: string;
  tecnicoNome: string;
  prioridade: PrioridadeOrdemPintura;
  prazo: string;
  etapa: EtapaOrdemPintura;
  referenciasVisuais: string[];
  criadoEm?: string;
  atualizadoEm?: string;
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

export interface ItemMistura {
  corId: string;
  nome?: string;
  fornecedor?: string;
  hex?: string;
  proporcao: number;
  volumeMl?: number;
  custo?: number;
}

export interface Mistura {
  id: string;
  nome: string;
  itens: ItemMistura[];
  volumeMl: number;
  hexResultado: string;
  custoEstimado: number;
  criadoEm?: string;
  atualizadoEm?: string;
}
