import { Box, Button } from '@mui/material';
import Typewriter from 'typewriter-effect';
import logo from './assets/synopspy_logo.png';

const HERO_TAGLINE = 'Know what you\'re agreeing to. Get AI-powered document analysis in seconds.';

const MainPage = () => {
  return (
    <Box id="main" sx={{
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      px: { xs: 2, md: 4 },
      py: 8,
      background: 'transparent',
    }}>
      <img src={logo} alt="logo" style={{ height: 150 }} />
      <Box
        component="p"
        sx={{
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          fontWeight: 400,
          color: '#6e6e73',
          mb: 5,
          lineHeight: 1.4,
          maxWidth: 720,
          mx: 'auto',
          '& .Typewriter__wrapper': { font: 'inherit', color: 'inherit' },
          '& .Typewriter__cursor': { color: 'inherit', fontWeight: 400 },
        }}
      >
        <Typewriter
          options={{
            strings: [HERO_TAGLINE],
            autoStart: true,
            loop: false,
            delay: 42,
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          href="#upload"
          variant="contained"
          sx={{
            bgcolor: '#4a4a4a',
            color: '#fff',
            px: 3,
            py: 1.25,
            fontSize: '1.0625rem',
            fontWeight: 400,
            borderRadius: 980,
            '&:hover': { bgcolor: '#333333' }
          }}
        >
          Get started
        </Button>
        <Button
          href="#features"
          variant="outlined"
          sx={{
            borderColor: '#4a4a4a',
            color: '#4a4a4a',
            px: 3,
            py: 1.25,
            fontSize: '1.0625rem',
            fontWeight: 400,
            borderRadius: 980,
            '&:hover': { bgcolor: 'rgba(74,74,74,0.06)', borderColor: '#333333' }
          }}
        >
          Learn more
        </Button>
      </Box>
    </Box>
  );
};

export default MainPage;