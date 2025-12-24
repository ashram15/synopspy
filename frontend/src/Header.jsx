
import logo from './assets/logo.png';
import './App.css';
import './styles/modern.css';
import { Box, Button } from '@mui/material';

const Header = () => {
  return (
    <Box component="header" sx={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      bgcolor: 'rgba(255,255,255,0.8)',
      backdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <Box sx={{
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 2, md: 4 },
        py: 1.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src={logo} alt="logo" style={{ height: 32 }} />
          <Box sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#1d1d1f' }}>SynopSpy</Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Button href="#features" sx={{ color: '#1d1d1f', fontSize: '0.875rem', fontWeight: 400, textTransform: 'none', '&:hover': { bgcolor: 'transparent' } }}>Features</Button>
          <Button href="#upload" sx={{ color: '#1d1d1f', fontSize: '0.875rem', fontWeight: 400, textTransform: 'none', '&:hover': { bgcolor: 'transparent' } }}>Upload</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Header;