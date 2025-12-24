
import { Box, Typography, Button } from '@mui/material';
import oandp from './assets/oandp.png';

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
      background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)',
    }}>
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Typography variant="h1" sx={{ 
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
          fontWeight: 700,
          color: '#1d1d1f',
          mb: 2,
          lineHeight: 1.05,
          letterSpacing: '-0.015em'
        }}>
          Document analysis.
        </Typography>
        <Typography variant="h1" sx={{ 
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
          fontWeight: 700,
          background: 'linear-gradient(90deg, #00BF63 0%, #048748 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3,
          lineHeight: 1.05,
          letterSpacing: '-0.015em'
        }}>
          Simplified.
        </Typography>
        <Typography variant="h3" sx={{ 
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          fontWeight: 400,
          color: '#6e6e73',
          mb: 5,
          lineHeight: 1.4
        }}>
          AI-powered insights for your documents in seconds.
        </Typography>
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
    </Box>
  );
};

export default MainPage;