

import Header from './Header';
import MainPage from './MainPage';
import Features from './Features';
import Upload from './Upload';
import Footer from './Footer';
import './App.css';
import './styles/modern.css';

import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
    },
    secondary: {
      main: '#EBF9D9',
    },
    background: {
      default: '#EBF9D9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1d1d1f',
      secondary: '#6e6e73',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.07,
      letterSpacing: '-0.015em'
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: '-0.01em'
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.2
    },
    body1: {
      fontSize: '1.0625rem',
      lineHeight: 1.47,
    },
  },
  shape: {
    borderRadius: 18,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 980,
          fontSize: '1.0625rem',
          fontWeight: 400,
          padding: '12px 22px',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="App" sx={{ minHeight: '100vh', bgcolor: '#EBF9D9' }}>
        <Header />
        <MainPage />
        <Features />
        <Upload />
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
