import { EventData } from '../types';

class Event {
  id?: string;
  userId: string;
  nome: string;
  data: string;
  descricao: string;
  horarioInicio: string;
  horarioFim: string;
  participantes: string[];

  constructor(
    id: string | undefined,
    userId: string,
    nome: string,
    data: Date | string,
    descricao: string ,
    horarioInicio: string,
    horarioFim: string ,
    participantes: string[],

  ) {
    this.id = id;
    this.userId = userId;
    this.nome = nome;
    this.data = this.formatarData(data);
    this.descricao = descricao;
    this.horarioInicio = horarioInicio;
    this.horarioFim = horarioFim;
    this.participantes = participantes;
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
      id: this.id || '',
      userId: this.userId,
      nome: this.nome,
      data: this.data,
      descricao: this.descricao,
      horarioInicio: this.horarioInicio,
      horarioFim: this.horarioFim,
      participantes: this.participantes,  
    };
  }

  static fromJSON(json: EventData): Event {
    return new Event(
      json.id,
      json.userId,
      json.nome,
      json.data,
      json.descricao || '',
      json.horarioInicio || '',
      json.horarioFim || '',
      json.participantes || [],
    );
  }

  validar() {
    console.log('Validando evento:', this);
    return (
      this.userId &&
      this.nome &&
      this.nome.trim() !== '' &&
      this.data
    );
  }
}

export default Event;
