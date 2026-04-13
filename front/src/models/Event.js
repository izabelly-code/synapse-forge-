/**
 * Evento Model
 * Representa um evento no calendário
 */
class Event {
  /**
   * Cria uma nova instância de Evento
   * @param {string} userId - ID do usuário proprietário do evento
   * @param {string} nome - Nome/título do evento
   * @param {Date|string} data - Data vinculada ao evento
   * @param {string} descricao - Descrição do evento (opcional)
   * @param {string} horarioInicio - Horário de início (opcional)
   * @param {string} horarioFim - Horário de término (opcional)
   * @param {string[]} participantes - Lista de participantes (opcional)
   */
  constructor(
    userId,
    nome,
    data,
    descricao = '',
    horarioInicio = '',
    horarioFim = '',
    participantes = [],

  ) {
    this.userId = userId;
    this.nome = nome;
    this.data = this.formatarData(data);
    this.descricao = descricao;
    this.horarioInicio = horarioInicio;
    this.horarioFim = horarioFim;
    this.participantes = participantes;
  }

  /**
   * Gera um ID único para o evento
   * @returns {string}
   */
  gerarId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Formata a data para um formato consistente (YYYY-MM-DD)
   * @param {Date|string} data
   * @returns {string}
   */
  formatarData(data) {
    if (data instanceof Date) {
      return data.toISOString().split('T')[0];
    }
    if (typeof data === 'string') {
      return data;
    }
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Retorna o objeto como um JSON limpo para enviar ao servidor
   * @returns {object}
   */
  toJSON() {
    return {
      userId: this.userId,
      nome: this.nome,
      data: this.data,
      descricao: this.descricao,
      horarioInicio: this.horarioInicio,
      horarioFim: this.horarioFim,
      participantes: this.participantes,  
    };
  }

  /**
   * Cria uma instância de Event a partir de um objeto JSON
   * @param {object} json
   * @returns {Event}
   */
  static fromJSON(json) {
    return new Event(
      json.user_id,
      json.nome,
      json.data,
      json.id,
      json.descricao || '',
      json.horarioInicio || '',
      json.horarioFim || '',
      json.participantes || [],
      json.criado_em,
      json.atualizado_em
    );
  }

  /**
   * Valida se o evento possui todos os campos obrigatórios
   * @returns {boolean}
   */
  validar() {
    return (
      this.userId &&
      this.nome &&
      this.nome.trim() !== '' &&
      this.data
    );
  }

  /**
   * Retorna uma descrição em texto do evento
   * @returns {string}
   */
  toString() {
    return `Evento: ${this.nome} | Usuário: ${this.user_id} | Data: ${this.data}`;
  }
}

export default Event;
