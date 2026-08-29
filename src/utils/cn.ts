import { clsx, type ClassValue } from "clsx";

/** Junta classes CSS condicionais: use no lugar de template literals com ternários no className. */
export function cn(...classes: ClassValue[]): string {
    return clsx(classes);
}
