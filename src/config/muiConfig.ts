import { createTheme, ThemeOptions } from '@mui/material';

const sharedThemeOptions: ThemeOptions = {
  typography: {
    button: {
      textTransform: 'none'
    }
  },
  zIndex: { snackbar: 100000 }
};
export const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    primary: {
      main: '#FF8C00', // DarkOrange
      light: '#FFB84D',
      dark: '#E67E00',
      contrastText: '#ffffff'
    },
    background: {
      default: '#FFFAF0', // FloralWhite
      paper: '#ffffff',
      hover: '#FFF5E6',
      lightSecondary: '#FFF0DB',
      darkSecondary: '#FF8C00'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          color: '#ffffff',
          backgroundColor: '#FF8C00',
          '&:hover': {
            backgroundColor: '#E67E00'
          }
        }
      }
    }
  }
});

export const darkTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF8C00',
      light: '#FFB84D',
      dark: '#E67E00',
      contrastText: '#ffffff'
    },
    background: {
      default: '#1A1100', // Very dark orange/black
      paper: '#261900',
      hover: '#332200',
      lightSecondary: '#402B00',
      darkSecondary: '#FF8C00'
    },
    text: { primary: '#ffffff' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          color: '#ffffff',
          backgroundColor: '#FF8C00',
          '&:hover': {
            backgroundColor: '#FFB84D'
          }
        }
      }
    }
  }
});
