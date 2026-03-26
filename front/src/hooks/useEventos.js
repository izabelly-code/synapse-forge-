import { useState, useEffect, useCallback } from 'react';
import { mockServer } from '../mocks/mockServer.js';

/**
 * Hook customizado para gerenciar eventos
 * Sincroniza com mock server e gerencia estado React
 *
 * @param {string} userId - ID do usuário
 * @returns {Object} - Estado e funções de gerenciamento
 */
export function useEventos(userId) {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);

  /**
   * Carrega eventos do mock server ao montar ou quando userId muda
   */
  useEffect(() => {
    carregarEventosDoServidor();
  }, [userId]);

  /**
   * Carrega eventos do servidor
   */
  const carregarEventosDoServidor = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await mockServer.getEventosPorUsuario(userId);
      if (resposta.sucesso) {
        setEventos(resposta.dados);
      }
    } catch (err) {
      setErro(err.erro || 'Erro ao carregar eventos');
      console.error('Erro:', err);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  /**
   * Cria um novo evento
   */
  const criarEvento = useCallback(
    async (nome, data, descricao = '', cor = '#0284c7') => {
      try {
        const resposta = await mockServer.criarEvento({
          user_id: userId,
          nome,
          data,
          descricao,
          cor,
        });
        if (resposta.sucesso) {
          setEventos((prev) => [...prev, resposta.dados]);
          return resposta.dados;
        }
      } catch (err) {
        setErro(err.erro || 'Erro ao criar evento');
        console.error('Erro:', err);
      }
    },
    [userId]
  );

  /**
   * Atualiza um evento existente
   */
  const atualizarEvento = useCallback(async (id, dadosAtualizacao) => {
    try {
      const resposta = await mockServer.atualizarEvento(id, dadosAtualizacao);
      if (resposta.sucesso) {
        setEventos((prev) =>
          prev.map((evt) => (evt.id === id ? resposta.dados : evt))
        );
        if (eventoSelecionado?.id === id) {
          setEventoSelecionado(resposta.dados);
        }
        return resposta.dados;
      }
    } catch (err) {
      setErro(err.erro || 'Erro ao atualizar evento');
      console.error('Erro:', err);
    }
  }, [eventoSelecionado]);

  /**
   * Deleta um evento
   */
  const deletarEvento = useCallback(async (id) => {
    try {
      const resposta = await mockServer.deletarEvento(id);
      if (resposta.sucesso) {
        setEventos((prev) => prev.filter((evt) => evt.id !== id));
        if (eventoSelecionado?.id === id) {
          setEventoSelecionado(null);
        }
        return true;
      }
    } catch (err) {
      setErro(err.erro || 'Erro ao deletar evento');
      console.error('Erro:', err);
    }
  }, [eventoSelecionado]);

  /**
   * Obtém eventos de uma data específica
   */
  const obterEventosPorData = useCallback(
    (data) => {
      return eventos.filter((evt) => evt.data === data);
    },
    [eventos]
  );

  /**
   * Seleciona um evento
   */
  const selecionarEvento = useCallback((evento) => {
    setEventoSelecionado(evento);
  }, []);

  /**
   * Deseleciona evento
   */
  const deselecionar = useCallback(() => {
    setEventoSelecionado(null);
  }, []);

  return {
    eventos,
    carregando,
    erro,
    eventoSelecionado,
    criarEvento,
    atualizarEvento,
    deletarEvento,
    obterEventosPorData,
    selecionarEvento,
    deselecionar,
    recarregar: carregarEventosDoServidor,
  };
}
