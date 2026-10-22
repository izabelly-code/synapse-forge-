/** Uma página de resultados vinda do backend (`PaginaResponseDTO`). */
export interface Pagina<T> {
    itens: T[];
    pagina: number;
    tamanho: number;
    /** Total que casa com o filtro, não só o desta página. */
    total: number;
    temMais: boolean;
}
