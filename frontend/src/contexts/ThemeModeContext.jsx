import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { buildTheme } from '../theme/theme';

const ThemeModeContext = createContext(null);

const STORAGE_KEY = 'wte_theme_mode';

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'dark');

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

ThemeModeProvider.propTypes = { children: PropTypes.node.isRequired };

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}
