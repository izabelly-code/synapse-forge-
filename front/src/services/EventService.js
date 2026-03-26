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
   * @param {string} user_id - ID do usuário
   * @param {string} nome - Nome do evento
   * @param {string|Date} data - Data do evento
   * @param {string} descricao - Descrição (opcional)
   * @param {string} cor - Cor (opcional)
   * @returns {Event}
   */
  criarEvento(user_id, nome, data, descricao = '', cor = '#0284c7') {
    const evento = new Event(user_id, nome, data, null, descricao, cor);
    
    if (!evento.validar()) {
      throw new Error('Evento inválido: campos obrigatórios ausentes');
    }

    this.eventos.push(evento);
    this.salvarNoLocalStorage();
    return evento;
  }

  /**
   * Obtém todos os eventos
   * @returns {Event[]}
   */
  obterTodos() {
    return this.eventos;
  }

  /**
   * Obtém eventos de um usuário específico
   * @param {string} user_id
   * @returns {Event[]}
   */
  obterPorUsuario(user_id) {
    return this.eventos.filter((evt) => evt.user_id === user_id);
  }

  /**
   * Obtém eventos de uma data específica
   * @param {string|Date} data - Data no formato YYYY-MM-DD ou Date
   * @returns {Event[]}
   */
  obterPorData(data) {
    const dataFormatada = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    return this.eventos.filter((evt) => evt.data === dataFormatada);
  }

  /**
   * Obtém eventos de um usuário em uma data específica
   * @param {string} user_id
   * @param {string|Date} data
   * @returns {Event[]}
   */
  obterPorUsuarioEData(user_id, data) {
    const dataFormatada = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    return this.eventos.filter(
      (evt) => evt.user_id === user_id && evt.data === dataFormatada
    );
  }

  /**
   * Obtém um evento pelo ID
   * @param {string} id
   * @returns {Event|null}
   */
  obterPorId(id) {
    return this.eventos.find((evt) => evt.id === id) || null;
  }

  /**
   * Atualiza um evento existente
   * @param {string} id - ID do evento
   * @param {object} dados - Dados a atualizar
   * @returns {Event|null}
   */
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
   * @param {string} user_id
   * @returns {number} - Quantidade de eventos deletados
   */
  deletarPorUsuario(user_id) {
    const quantidadeAnterior = this.eventos.length;
    this.eventos = this.eventos.filter((evt) => evt.user_id !== user_id);
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
        acc[evt.user_id] = (acc[evt.user_id] || 0) + 1;
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
