import Event from '../models/Event';
import { EventData } from '../types';

class EventService {
  private eventos: Event[];

  constructor() {
    this.eventos = [];
    this.carregarDoLocalStorage();
  }

 
  async criarEvento(userId: string, nome: string, data: string | Date, descricao: string = '', horarioInicio: string = '', horarioFim: string = '', participantes: string[] = []) {
    const evento = new Event('',userId, nome, data, descricao, horarioInicio, horarioFim, participantes);

    if (!evento.validar()) {
      throw new Error('Evento inválido: campos obrigatórios ausentes');
    }

    const eventoPayload = evento.toJSON();
    console.log('📤 Enviando evento para backend:', eventoPayload);
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

      const responseData = await response.json();
      console.log('✅ Evento registrado no backend:', responseData);

    } catch (erro) {
      console.warn('⚠️ Erro ao enviar evento ao backend', erro);
      return null;
    }
  }

  
  // obterPorUsuarioMes(userId, mes) {
  // try {
  //       const response = await fetch('http://localhost:8081/evento/registrar', {
  //         method: 'POST',
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify(eventoPayload),
  //       });

  //       if (!response.ok) {
  //         throw new Error(`Erro HTTP ${response.status}`);
  //       }

  //       const data = await response.json();
  //       console.log('✅ Evento registrado no backend:', data);

  //     } catch (erro) {
  //       console.warn('⚠️ Erro ao enviar evento ao backend', erro);
  //       return null;
  //     }
  // }

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

  atualizarEvento(id: string, dados: Partial<EventData>): Event | null {
    const evento = this.obterPorId(id);
    if (!evento) return null;

    Object.assign(
      evento,
      Object.fromEntries(
        Object.entries(dados).filter(([k]) => k !== 'id' && k !== 'criado_em')
      )
    );

    evento.atualizado_em = new Date();
    this.salvarNoLocalStorage();
    return evento;
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
