
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
      bgcolor: '#00BF63',
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
          <img src={logo} alt="logo" style={{ height: 64 }} />
          <Box sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#EBF9D9' }}>SynopSpy</Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button href="#features" sx={{ color: '#EBF9D9', fontSize: '1rem', fontWeight: 400, textTransform: 'none', '&:hover': { bgcolor: 'transparent' } }}>Features</Button>
          <Button href="#upload" sx={{ color: '#EBF9D9', fontSize: '1rem', fontWeight: 400, textTransform: 'none', '&:hover': { bgcolor: 'transparent' } }}>Upload</Button>
          {!isAuthenticated ? (
            <Button
              onClick={() => loginWithRedirect()}
              variant="contained"
              sx={{
                bgcolor: 'transparent',
                borderColor: '#EBF9D9',
                color: '#EBF9D9',
                fontSize: '0.875rem',
                px: 2,
                '&:hover': {
                  borderColor: '#EBF9D9',
                  bgcolor: 'rgba(0,113,227,0.06)'
                },
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
                  bgcolor: 'transparent',
                  borderColor: '#EBF9D9',
                  color: '#EBF9D9',
                  fontSize: '0.875rem',
                  px: 2,
                  '&:hover': {
                    borderColor: '#EBF9D9',
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