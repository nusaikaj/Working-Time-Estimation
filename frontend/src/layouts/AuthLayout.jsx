import { Outlet } from 'react-router-dom';
import { Box, Paper, Stack, Typography, useTheme } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';

/** Centered card layout shared by Login and Register. */
export default function AuthLayout() {
  const theme = useTheme();

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        px: 2,
        position: 'relative',
        overflow: 'hidden',
        background:
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top, #17223B 0%, #0B1220 60%)'
            : 'radial-gradient(circle at top, #EEF2FF 0%, #F4F6FB 60%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          top: -160,
          left: -140,
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0) 70%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          bottom: -160,
          right: -140,
          background: 'radial-gradient(circle, rgba(20,184,166,0.22) 0%, rgba(20,184,166,0) 70%)',
        }}
      />

      <Stack spacing={3} alignItems="center" sx={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366F1 0%, #14B8A6 100%)',
              boxShadow: '0 6px 18px 0 rgba(99, 102, 241, 0.45)',
            }}
          >
            <ScheduleIcon sx={{ fontSize: 24, color: '#fff' }} />
          </Box>
          <Typography variant="h5" fontWeight={800}>
            Working Time Estimation
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: { xs: 3, sm: 4 },
            border: 1,
            borderColor: 'divider',
            boxShadow: (t) => (t.palette.mode === 'dark' ? '0 20px 40px -12px rgba(0,0,0,0.5)' : '0 20px 40px -12px rgba(15,23,42,0.12)'),
          }}
        >
          <Outlet />
        </Paper>
      </Stack>
    </Box>
  );
}
