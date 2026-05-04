import Event from '../models/Event';
import { EventData } from '../types';

class EventService {
  private eventos: Event[];

  constructor() {
    this.eventos = [];
    this.carregarDoLocalStorage();
  }

 
  async criarEvento(
    userId: string,
    nome: string,
    data: string | Date,
    options: {
      descricao?: string;
      horarioInicio?: string;
      horarioFim?: string;
      participantes?: string[];
    } = {}
  ) {
    const {
      descricao = '',
      horarioInicio = '',
      horarioFim = '',
      participantes = [],
    } = options;

    const evento = new Event('', userId, nome, data, descricao, horarioInicio, horarioFim, participantes);

    if (!evento.validar()) {
      throw new Error('Evento inválido: campos obrigatórios ausentes');
    }

    const eventoPayload = {
      ...evento.toJSON(),
      participantes: participantes,
    };
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('http://localhost:8081/evento/registrar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventoPayload),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      return true;
    } catch (error_) {
      console.warn('⚠️ Erro ao enviar evento ao backend', error_);
      return null;
    }
  }
  
  async buscarEventosPorUsuarioMes(userId: string, mes: string, ano: string): Promise<EventData[]> {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8081/evento/buscar-mes/${userId}?mes=${mes}&ano=${ano}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }
      const data = await response.json();
      // Supondo que o backend retorna um array de eventos no formato EventData
      return data;
    } catch (error_) {
      console.warn('⚠️ Erro ao buscar eventos do backend', error_);
      return [];
    }
  }

  obterPorData(data: string | Date): Event[] {
    const dataFormatada = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    return this.eventos.filter((evt) => evt.data === dataFormatada);
  }

  /**
   * Obtém eventos de um usuário em uma data específica
   * @param {string} userId
   * @param {string|Date} data
   * @returns {Event[]}
   */
  obterPorUsuarioEData(userId: string, data: string | Date): Event[] {
    const dataFormatada = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    return this.eventos.filter(
      (evt) => evt.userId === userId && evt.data === dataFormatada
    );
  }

  obterPorId(id: string): Event | null {
    return this.eventos.find((evt) => evt.id === id) || null;
  }

  async atualizarEvento(id: string, dados: Partial<EventData>, userId?: string): Promise<EventData | null> {
    try {
      const token = localStorage.getItem('token');
      const payload: Partial<EventData> = {
        ...dados,
      };

      if (userId) {
        payload.userId = userId;
      }

      const response = await fetch(`http://localhost:8081/evento/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const updatedEvent = await response.json();
      return updatedEvent as EventData;
    } catch (error_) {
      console.warn('⚠️ Erro ao atualizar evento no backend', error_);
      return null;
    }
  }

  deletarEvento(id: string): boolean {
    const indice = this.eventos.findIndex((evt) => evt.id === id);
    if (indice > -1) {
      this.eventos.splice(indice, 1);
      this.salvarNoLocalStorage();
      return true;
    }
    return false;
  }

  /**
   * Deleta todos os eventos de um usuário
   * @param {string} userId
   * @returns {number} - Quantidade de eventos deletados
   */
  deletarPorUsuario(userId: string): number {
    const quantidadeAnterior = this.eventos.length;
    this.eventos = this.eventos.filter((evt) => evt.userId !== userId);
    const deletados = quantidadeAnterior - this.eventos.length;
    if (deletados > 0) {
      this.salvarNoLocalStorage();
    }
    return deletados;
  }

  salvarNoLocalStorage(): void {
    const dados = this.eventos.map((evt) => evt.toJSON());
    localStorage.setItem('eventos', JSON.stringify(dados));
  }

  carregarDoLocalStorage(): void {
    const dados = localStorage.getItem('eventos');
    if (dados) {
      try {
        const eventosJSON = JSON.parse(dados) as EventData[];
        this.eventos = eventosJSON.map((evt) => Event.fromJSON(evt));
      } catch (erro) {
        console.error('Erro ao carregar eventos do localStorage:', erro);
        this.eventos = [];
      }
    }
  }

  limparTodos(): void {
    this.eventos = [];
    localStorage.removeItem('eventos');
  }

  obterEstatisticas(): { total: number; porUsuario: Record<string, number>; porData: Record<string, number> } {
    return {
      total: this.eventos.length,
      porUsuario: this.eventos.reduce<Record<string, number>>((acc, evt) => {
        acc[evt.userId] = (acc[evt.userId] || 0) + 1;
        return acc;
      }, {}),
      porData: this.eventos.reduce<Record<string, number>>((acc, evt) => {
        acc[evt.data] = (acc[evt.data] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

export default new EventService();
