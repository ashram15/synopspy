
import logo from './assets/logo.png';
import './App.css';
import './styles/modern.css';
import { Box, Button, Avatar } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

const Header = () => {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

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
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button href="#features" sx={{ color: '#1d1d1f', fontSize: '0.875rem', fontWeight: 400, textTransform: 'none', '&:hover': { bgcolor: 'transparent' } }}>Features</Button>
          <Button href="#upload" sx={{ color: '#1d1d1f', fontSize: '0.875rem', fontWeight: 400, textTransform: 'none', '&:hover': { bgcolor: 'transparent' } }}>Upload</Button>
          {!isAuthenticated ? (
            <Button
              onClick={() => loginWithRedirect()}
              variant="contained"
              sx={{
                bgcolor: '#0071e3',
                color: '#fff',
                fontSize: '0.875rem',
                px: 2,
                '&:hover': { bgcolor: '#0077ed' },
              }}
            >
              Log In
            </Button>
          ) : (
            <>
              <Avatar
                src={user?.picture}
                alt={user?.name || 'User'}
                sx={{ width: 30, height: 30 }}
              />
              <Button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                variant="outlined"
                sx={{
                  borderColor: '#0071e3',
                  color: '#0071e3',
                  fontSize: '0.875rem',
                  px: 2,
                  '&:hover': {
                    borderColor: '#0071e3',
                    bgcolor: 'rgba(0,113,227,0.06)',
                  },
                }}
              >
                Log Out
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Header;