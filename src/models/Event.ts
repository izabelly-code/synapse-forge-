import { EventData } from '../types';

class Event implements EventData {
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

  constructor(
    user_id: string,
    nome: string,
    data: Date | string,
    id: string | null = null,
    descricao = '',
    startTime = '',
    endTime = '',
    participantes: string[] = [],
    criado_em: Date | string = new Date(),
    atualizado_em: Date | string = new Date()
  ) {
    this.id = id || this.gerarId();
    this.user_id = user_id;
    this.nome = nome;
    this.data = this.formatarData(data);
    this.descricao = descricao;
    this.startTime = startTime;
    this.endTime = endTime;
    this.participantes = participantes;
    this.criado_em = criado_em;
    this.atualizado_em = atualizado_em;
  }

  gerarId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatarData(data: Date | string): string {
    if (data instanceof Date) {
      return data.toISOString().split('T')[0];
    }
    if (typeof data === 'string') {
      return data;
    }
    return new Date().toISOString().split('T')[0];
  }

  toJSON(): EventData {
    return {
      id: this.id,
      user_id: this.user_id,
      nome: this.nome,
      data: this.data,
      descricao: this.descricao,
      startTime: this.startTime,
      endTime: this.endTime,
      participantes: this.participantes,
      criado_em: this.criado_em,
      atualizado_em: this.atualizado_em,
    };
  }

  static fromJSON(json: EventData): Event {
    return new Event(
      json.user_id,
      json.nome,
      json.data,
      json.id,
      json.descricao || '',
      json.startTime || '',
      json.endTime || '',
      json.participantes || [],
      json.criado_em,
      json.atualizado_em
    );
  }

  validar(): boolean {
    return !!(
      this.user_id &&
      this.nome &&
      this.nome.trim() !== '' &&
      this.data &&
      this.id
    );
  }

  toString(): string {
    return `Evento: ${this.nome} | Usuário: ${this.user_id} | Data: ${this.data}`;
  }
}

export default Event;
