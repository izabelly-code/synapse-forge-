export class PedidoFileService {
  private apiBaseUrl: string;
  private token: string;

  constructor(apiBaseUrl: string, token: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }

  async downloadObjeto3D(pedidoId: string, nomeArquivo?: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/pedidos/${pedidoId}/obj3d`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.status}`);
      }
    
      const blob = await response.blob();
      
      // Extrair nome do arquivo do header Content-Disposition se disponível
      const contentDisposition = response.headers.get('content-disposition');
      let filename = nomeArquivo || 'modelo-3d';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Criar link de download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar objeto 3D:', error);
      throw error;
    }
  }
}