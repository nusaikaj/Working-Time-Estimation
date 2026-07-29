import PropTypes from 'prop-types';
import { Alert, AlertTitle, Button, Stack } from '@mui/material';

/** Consistent inline error panel with an optional retry action. */
export default function ErrorState({ message, onRetry }) {
  return (
    <Alert severity="error" variant="outlined">
      <AlertTitle>Something went wrong</AlertTitle>
      <Stack spacing={1.5} alignItems="flex-start">
        <span>{message || 'Please try again.'}</span>
        {onRetry && (
          <Button size="small" color="error" variant="outlined" onClick={onRetry}>
            Retry
          </Button>
        )}
      </Stack>
    </Alert>
  );
}

ErrorState.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
};
