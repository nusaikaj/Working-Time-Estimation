import { createTheme } from '@mui/material/styles';

// A single professional palette shared by both modes — indigo primary /
// teal accent reads well as "enterprise dashboard" in either light or dark.
// Headings use Lexend (a distinct display face) while body text stays on
// Inter, so the UI reads as a designed product rather than default MUI.
const shared = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ['Inter', 'Roboto', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    h4: { fontFamily: '"Lexend", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontFamily: '"Lexend", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontFamily: '"Lexend", sans-serif', fontWeight: 600 },
    subtitle1: { fontWeight: 700 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        },
        contained: {
          boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.28)',
          '&:hover': {
            boxShadow: '0 6px 16px 0 rgba(99, 102, 241, 0.38)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { transition: 'background-color 0.12s ease' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'medium' },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
  },
};

export function buildTheme(mode) {
  return createTheme({
    ...shared,
    palette: {
      mode,
      primary: { main: '#6366F1', light: '#818CF8', dark: '#4338CA', contrastText: '#fff' },
      secondary: { main: '#14B8A6', light: '#5EEAD4', dark: '#0F766E', contrastText: '#04211D' },
      success: { main: '#22C55E' },
      warning: { main: '#F59E0B' },
      error: { main: '#EF4444' },
      info: { main: '#38BDF8' },
      ...(mode === 'dark'
        ? {
            background: { default: '#0B1220', paper: '#121A2B' },
            divider: 'rgba(148, 163, 184, 0.16)',
          }
        : {
            background: { default: '#F4F6FB', paper: '#FFFFFF' },
            divider: 'rgba(15, 23, 42, 0.08)',
          }),
    },
  });
}
