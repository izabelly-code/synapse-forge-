import { createContext } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "sf-theme";

export interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
