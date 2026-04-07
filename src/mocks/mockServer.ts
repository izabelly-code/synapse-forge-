import { EventData } from '../types';

interface MockServerSuccess<T> {
  sucesso: true;
  dados: T;
  mensagem?: string;
}

interface MockServerError {
  sucesso: false;
  erro: string;
  status: number;
}

class MockServer {
  private eventos: EventData[];

  constructor() {
    this.eventos = [];
    this.carregarDados();
    this.inicializarDadosMock();
  }

  inicializarDadosMock(): void {
    if (this.eventos.length === 0) {
      const hoje = new Date();
      const dataAtual = hoje.toISOString().split('T')[0];
      const dataProxima = new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dataAnterior = new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const eventosMock: EventData[] = [
        {
          id: 'evt_mock_1',
          user_id: 'user_123',
          nome: 'Reunião de Planejamento',
          data: dataAtual,
          descricao: 'Discussão sobre objetivos do mês',
          startTime: '09:00',
          endTime: '10:30',
          participantes: ['Ana', 'Carlos'],
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        },
        {
          id: 'evt_mock_2',
          user_id: 'user_123',
          nome: 'Almoço com Cliente',
          data: dataProxima,
          descricao: 'Almoço para conversar sobre novo projeto',
          startTime: '12:30',
          endTime: '13:30',
          participantes: ['Patrícia'],
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        },
        {
          id: 'evt_mock_3',
          user_id: 'user_123',
          nome: 'Revisão de Código',
          data: dataAtual,
          descricao: 'Code review dos PR abertos',
          startTime: '15:00',
          endTime: '16:00',
          participantes: ['Bruno', 'Gabriel'],
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        },
        {
          id: 'evt_mock_4',
          user_id: 'user_123',
          nome: 'Sprint Planning',
          data: dataAnterior,
          descricao: 'Planejamento da sprint da semana',
          startTime: '10:00',
          endTime: '11:30',
          participantes: ['Marina', 'Lucas'],
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        },
      ];

      this.eventos = eventosMock;
      this.salvarDados();
      console.log('✅ Mock Server inicializado com dados de teste');
    }
  }

  async getEventos(): Promise<MockServerSuccess<EventData[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📨 Mock GET /api/eventos');
        resolve({ sucesso: true, dados: this.eventos });
      }, 300);
    });
  }

  async getEventosPorUsuario(userId: string): Promise<MockServerSuccess<EventData[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const eventos = this.eventos.filter((evt) => evt.user_id === userId);
        console.log(`📨 Mock GET /api/eventos?user_id=${userId}`);
        resolve({ sucesso: true, dados: eventos });
      }, 300);
    });
  }

  async getEventosPorData(data: string): Promise<MockServerSuccess<EventData[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const eventos = this.eventos.filter((evt) => evt.data === data);
        console.log(`📨 Mock GET /api/eventos?data=${data}`);
        resolve({ sucesso: true, dados: eventos });
      }, 300);
    });
  }

  async getEventoPorId(id: string): Promise<MockServerSuccess<EventData>> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const evento = this.eventos.find((evt) => evt.id === id);
        console.log(`📨 Mock GET /api/eventos/${id}`);
        if (evento) {
          resolve({ sucesso: true, dados: evento });
        } else {
          const err: MockServerError = { sucesso: false, erro: 'Evento não encontrado', status: 404 };
          reject(err);
        }
      }, 300);
    });
  }

  async atualizarEvento(
    id: string,
    dadosAtualizacao: Partial<EventData>
  ): Promise<MockServerSuccess<EventData>> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const indice = this.eventos.findIndex((evt) => evt.id === id);
        if (indice > -1) {
          this.eventos[indice] = {
            ...this.eventos[indice],
            ...dadosAtualizacao,
            atualizado_em: new Date().toISOString(),
          };
          this.salvarDados();
          console.log(`📨 Mock PUT /api/eventos/${id} - Evento atualizado`);
          resolve({
            sucesso: true,
            dados: this.eventos[indice],
            mensagem: 'Evento atualizado com sucesso',
          });
        } else {
          const err: MockServerError = { sucesso: false, erro: 'Evento não encontrado', status: 404 };
          reject(err);
        }
      }, 300);
    });
  }

  async deletarEvento(id: string): Promise<MockServerSuccess<EventData>> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const indice = this.eventos.findIndex((evt) => evt.id === id);
        if (indice > -1) {
          const eventoRemovido = this.eventos.splice(indice, 1);
          this.salvarDados();
          console.log(`📨 Mock DELETE /api/eventos/${id} - Evento deletado`);
          resolve({
            sucesso: true,
            mensagem: 'Evento deletado com sucesso',
            dados: eventoRemovido[0],
          });
        } else {
          const err: MockServerError = { sucesso: false, erro: 'Evento não encontrado', status: 404 };
          reject(err);
        }
      }, 300);
    });
  }

  salvarDados(): void {
    localStorage.setItem('mock_eventos', JSON.stringify(this.eventos));
  }

  carregarDados(): void {
    const dados = localStorage.getItem('mock_eventos');
    if (dados) {
      try {
        this.eventos = JSON.parse(dados) as EventData[];
        console.log('📂 Dados carregados do localStorage');
      } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        this.eventos = [];
      }
    }
  }

  limparTodos(): void {
    this.eventos = [];
    localStorage.removeItem('mock_eventos');
    console.log('🗑️ Todos os dados foram limpos');
  }

  obterEstatisticas(): { totalEventos: number; porUsuario: Record<string, number>; porData: Record<string, number> } {
    return {
      totalEventos: this.eventos.length,
      porUsuario: this.eventos.reduce<Record<string, number>>((acc, evt) => {
        acc[evt.user_id] = (acc[evt.user_id] || 0) + 1;
        return acc;
      }, {}),
      porData: this.eventos.reduce<Record<string, number>>((acc, evt) => {
        acc[evt.data] = (acc[evt.data] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

export const mockServer = new MockServer();

console.log('🚀 Mock Server iniciado');
