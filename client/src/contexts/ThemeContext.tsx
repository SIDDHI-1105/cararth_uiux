// FILE: client/src/contexts/ThemeContext.tsx – Dark/light mode fixed

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  console.log("[DEBUG] ThemeProvider: Rendering");

  // Read initial theme from the HTML element (set by inline script)
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  console.log("[DEBUG] ThemeProvider: theme=", theme, "mounted=", mounted);

  useEffect(() => {
    setMounted(true);
    // Sync with any external theme changes
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setThemeState(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the new theme class
    root.classList.add(newTheme);

    // Set data-theme attribute for CSS variables
    root.setAttribute('data-theme', newTheme);

    // Save to localStorage
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
