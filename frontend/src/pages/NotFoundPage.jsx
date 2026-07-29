import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';

export default function NotFoundPage() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" sx={{ px: 2 }}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography variant="h2" fontWeight={800} color="primary.main">
          404
        </Typography>
        <Typography variant="h6">Page not found</Typography>
        <Typography variant="body2" color="text.secondary">
          The page you are looking for doesn&apos;t exist or has been moved.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Back to Dashboard
        </Button>
      </Stack>
    </Box>
  );
}
