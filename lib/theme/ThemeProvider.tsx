'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
  systemTheme: Theme;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children,
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = 'theme',
  transitionDuration = 150
}: { 
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
  transitionDuration?: number;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Once mounted on client, we can show the provider
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      storageKey={storageKey}
      value={{
        dark: 'dark',
        light: 'light',
        system: 'system',
      }}
    >
      <ThemeProviderContent isLoaded={isLoaded} transitionDuration={transitionDuration}>
        {children}
      </ThemeProviderContent>
    </NextThemesProvider>
  );
}

function ThemeProviderContent({ 
  children, 
  isLoaded,
  transitionDuration
}: { 
  children: React.ReactNode;
  isLoaded: boolean;
  transitionDuration: number;
}) {
  const { theme, setTheme, resolvedTheme, systemTheme } = useThemeState();
  
  // Apply transition duration style to html element
  useEffect(() => {
    const html = document.documentElement;
    if (isLoaded) {
      html.style.setProperty('--theme-transition-duration', `${transitionDuration}ms`);
      html.classList.add('theme-transition');
      return () => {
        html.classList.remove('theme-transition');
        html.style.removeProperty('--theme-transition-duration');
      };
    }
  }, [isLoaded, transitionDuration]);

  return (
    <ThemeContext.Provider value={{ 
      theme: theme as Theme, 
      setTheme, 
      resolvedTheme: resolvedTheme as Theme, 
      systemTheme: systemTheme as Theme,
      isLoaded,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper hook for the provider
function useThemeState() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<Theme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Get stored theme or default to system
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = storedTheme || 'system';
    setThemeState(initialTheme);
    
    // Detect system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemIsDark = mediaQuery.matches;
    setSystemTheme(systemIsDark ? 'dark' : 'light');
    
    // Apply resolved theme initially
    const resolvedInitial = initialTheme === 'system' ? (systemIsDark ? 'dark' : 'light') : initialTheme;
    setResolvedTheme(resolvedInitial);
    
    // Watch for system theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      
      if (theme === 'system') {
        setResolvedTheme(newSystemTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
    
    // Update resolved theme
    if (newTheme === 'system') {
      setResolvedTheme(systemTheme);
    } else {
      setResolvedTheme(newTheme);
    }
  };
  
  return { theme, setTheme, resolvedTheme, systemTheme };
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};