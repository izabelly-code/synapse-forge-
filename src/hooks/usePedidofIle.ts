import { useCallback, useState } from 'react';
import { PedidoFileService } from '../services/PedidoFileService';

export const usePedidoFile = (apiBaseUrl: string, token: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileService = new PedidoFileService(apiBaseUrl, token);

  const downloadObjeto3D = useCallback(
    async (pedidoId: string, nomeArquivo?: string) => {
      setLoading(true);
      setError(null);
      try {
        await fileService.downloadObjeto3D(pedidoId, nomeArquivo);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [fileService]
  );

  return { downloadObjeto3D, loading, error };
};