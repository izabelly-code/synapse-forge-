export const PAPEIS = ["ADMIN", "GERENTE", "TECNICO", "CLIENTE"] as const;
export type Papel = (typeof PAPEIS)[number];

export function ehPapel(valor: unknown): valor is Papel {
    return PAPEIS.includes(valor as Papel);
}
