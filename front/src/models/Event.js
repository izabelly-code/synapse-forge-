/**
 * Evento Model
 * Representa um evento no calendário
 */
class Event {
  /**
   * Cria uma nova instância de Evento
   * @param {string} id - ID único do evento (opcional, gerado se não fornecido)
   * @param {string} user_id - ID do usuário proprietário do evento
   * @param {string} nome - Nome/título do evento
   * @param {Date|string} data - Data vinculada ao evento
   * @param {string} descricao - Descrição do evento (opcional)
   * @param {Date} criado_em - Data de criação (opcional)
   * @param {Date} atualizado_em - Data de última atualização (opcional)
   */
  constructor(
    user_id,
    nome,
    data,
    id = null,
    descricao = '',
    startTime = '',
    endTime = '',
    participantes = [],
    criado_em = new Date(),
    atualizado_em = new Date()
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
      json.startTime || '',
      json.endTime || '',
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
      this.user_id &&
      this.nome &&
      this.nome.trim() !== '' &&
      this.data &&
      this.id
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
