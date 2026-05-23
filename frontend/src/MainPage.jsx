import { Box, Button } from '@mui/material';
import Typewriter from 'typewriter-effect';
import logo from './assets/synopspy_logo.png';

const HERO_TAGLINE = 'Get AI-powered document analysis in seconds.';

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
            bgcolor: '#0071e3',
            color: '#fff',
            px: 3,
            py: 1.25,
            fontSize: '1.0625rem',
            fontWeight: 400,
            borderRadius: 980,
            '&:hover': { bgcolor: '#0077ed' }
          }}
        >
          Get started
        </Button>
        <Button
          href="#features"
          variant="outlined"
          sx={{
            borderColor: '#0071e3',
            color: '#0071e3',
            px: 3,
            py: 1.25,
            fontSize: '1.0625rem',
            fontWeight: 400,
            borderRadius: 980,
            '&:hover': { bgcolor: 'rgba(0,113,227,0.04)', borderColor: '#0071e3' }
          }}
        >
          Learn more
        </Button>
      </Box>
    </Box>
  );
};

export default MainPage;