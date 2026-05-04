import { useState, useEffect, useCallback } from 'react';
import { mockServer } from '../mocks/mockServer';
import EventService from '../services/EventService';
import { EventData } from '../types';

interface EventoData {
  nome: string;
  data: string;
  descricao?: string;
  startTime?: string;
  endTime?: string;
  participantes?: string[];
}

export function useEventos(userId: string) {
  const [eventos, setEventos] = useState<EventData[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [eventoSelecionado, setEventoSelecionado] = useState<EventData | null>(null);

  const carregarEventosDoServidor = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await mockServer.getEventosPorUsuario(userId);
      if (resposta.sucesso) {
        setEventos(resposta.dados);
      }
    } catch (err) {
      const e = err as { erro?: string; message?: string };
      setErro(e.erro || e.message || 'Erro ao carregar eventos');
      console.error('Erro:', err);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    carregarEventosDoServidor();
  }, [carregarEventosDoServidor]);

  const criarEvento = useCallback(
    async (eventoData: EventoData) => {
      try {
        const novoEvento = await EventService.criarEvento(
          userId,
          eventoData.nome,
          eventoData.data,
          eventoData.descricao || '',
          eventoData.startTime || '',
          eventoData.endTime || '',
          eventoData.participantes || []
        );

        setEventos((prev) => [...prev, novoEvento]);
        return novoEvento;
      } catch (err) {
        const e = err as { message?: string };
        setErro(e.message || 'Erro ao criar evento');
        console.error('Erro:', err);
      }
    },
    [userId]
  );

  const adicionarEvento = useCallback((evento: EventData) => {
    setEventos((prev) => [...prev, evento]);
  }, []);

  const atualizarEvento = useCallback(async (id: string, dadosAtualizacao: Partial<EventData>) => {
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
      const e = err as { erro?: string };
      setErro(e.erro || 'Erro ao atualizar evento');
      console.error('Erro:', err);
    }
  }, [eventoSelecionado]);

  const deletarEvento = useCallback(async (id: string) => {
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
      const e = err as { erro?: string };
      setErro(e.erro || 'Erro ao deletar evento');
      console.error('Erro:', err);
    }
  }, [eventoSelecionado]);

  const obterEventosPorData = useCallback(
    (data: string) => {
      return eventos.filter((evt) => evt.data === data);
    },
    [eventos]
  );

  const selecionarEvento = useCallback((evento: EventData) => {
    setEventoSelecionado(evento);
  }, []);

  const deselecionar = useCallback(() => {
    setEventoSelecionado(null);
  }, []);

  return {
    eventos,
    carregando,
    erro,
    eventoSelecionado,
    criarEvento,
    adicionarEvento,
    atualizarEvento,
    deletarEvento,
    obterEventosPorData,
    selecionarEvento,
    deselecionar,
    recarregar: carregarEventosDoServidor,
  };
}
