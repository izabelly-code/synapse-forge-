import Event from '../models/Event.js';

/**
 * Serviço de Gerenciamento de Eventos
 * Gerencia a criação, leitura, atualização e exclusão de eventos
 */
class EventService {
  constructor() {
    this.eventos = [];
    this.carregarDoLocalStorage();
  }

  /**
   * Cria um novo evento
   * @param {string} userId - ID do usuário
   * @param {string} nome - Nome do evento
   * @param {string|Date} data - Data do evento
   * @param {string} descricao - Descrição (opcional)
   * @param {string} startTime - Horário de início (opcional)
   * @param {string} endTime - Horário de término (opcional)
   * @param {string[]} participantes - Lista de participantes (opcional)
   * @returns {Event}
   */
  async criarEvento(userId, nome, data, descricao = '', horarioInicio = '', horarioFim = '', participantes = []) {
    const evento = new Event(userId, nome, data, descricao, horarioInicio, horarioFim, participantes);

    if (!evento.validar()) {
      throw new Error('Evento inválido: campos obrigatórios ausentes');
    }

    const eventoPayload = evento.toJSON();
    console.log('📤 Enviando evento para backend:', eventoPayload);

    try {
      const response = await fetch('http://localhost:8081/evento/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventoPayload),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Evento registrado no backend:', data);

    } catch (erro) {
      console.warn('⚠️ Erro ao enviar evento ao backend', erro);
      return null;
    }
  }

  
  obterPorUsuarioMes(userId, mes) {
  try {
        const response = await fetch('http://localhost:8081/evento/registrar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventoPayload),
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Evento registrado no backend:', data);

      } catch (erro) {
        console.warn('⚠️ Erro ao enviar evento ao backend', erro);
        return null;
      }
  }


  obterPorData(data) {
    const dataFormatada = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    return this.eventos.filter((evt) => evt.data === dataFormatada);
  }

  /**
   * Obtém eventos de um usuário em uma data específica
   * @param {string} userId
   * @param {string|Date} data
   * @returns {Event[]}
   */
  obterPorUsuarioEData(userId, data) {
    const dataFormatada = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    return this.eventos.filter(
      (evt) => evt.userId === userId && evt.data === dataFormatada
    );
  }

  obterPorId(id) {
    return this.eventos.find((evt) => evt.id === id) || null;
  }

  atualizarEvento(id, dados) {
    const evento = this.obterPorId(id);
    if (!evento) {
      return null;
    }

    Object.keys(dados).forEach((chave) => {
      if (chave !== 'id' && chave !== 'criado_em') {
        evento[chave] = dados[chave];
      }
    });

    evento.atualizado_em = new Date();
    this.salvarNoLocalStorage();
    return evento;
  }

  /**
   * Deleta um evento
   * @param {string} id - ID do evento
   * @returns {boolean}
   */
  deletarEvento(id) {
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
  deletarPorUsuario(userId) {
    const quantidadeAnterior = this.eventos.length;
    this.eventos = this.eventos.filter((evt) => evt.userId !== userId);
    const deletados = quantidadeAnterior - this.eventos.length;
    if (deletados > 0) {
      this.salvarNoLocalStorage();
    }
    return deletados;
  }

  /**
   * Salva eventos no localStorage
   */
  salvarNoLocalStorage() {
    const dados = this.eventos.map((evt) => evt.toJSON());
    localStorage.setItem('eventos', JSON.stringify(dados));
  }

  /**
   * Carrega eventos do localStorage
   */
  carregarDoLocalStorage() {
    const dados = localStorage.getItem('eventos');
    if (dados) {
      try {
        const eventosJSON = JSON.parse(dados);
        this.eventos = eventosJSON.map((evt) => Event.fromJSON(evt));
      } catch (erro) {
        console.error('Erro ao carregar eventos do localStorage:', erro);
        this.eventos = [];
      }
    }
  }

  /**
   * Limpa todos os eventos
   */
  limparTodos() {
    this.eventos = [];
    localStorage.removeItem('eventos');
  }

  /**
   * Retorna estatísticas dos eventos
   * @returns {object}
   */
  obterEstatisticas() {
    return {
      total: this.eventos.length,
      porUsuario: this.eventos.reduce((acc, evt) => {
        acc[evt.userId] = (acc[evt.userId] || 0) + 1;
        return acc;
      }, {}),
      porData: this.eventos.reduce((acc, evt) => {
        acc[evt.data] = (acc[evt.data] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

// Exporta uma instância única (singleton)
export default new EventService();
