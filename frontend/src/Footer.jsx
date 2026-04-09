
import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box component="footer" id="footer" sx={{
      width: '100%',
      py: 4,
      textAlign: 'center',
      bgcolor: '#f5f5f7',
      borderTop: '1px solid #d2d2d7',
      mt: 8
    }}>
      <Typography variant="body2" sx={{ color: '#6e6e73', fontSize: '0.875rem' }}>
        © 2025 SynopSpy. All rights reserved.
      </Typography>
    </Box>
  );
}
