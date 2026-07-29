import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

export default function EmptyState({ title = 'Nothing here yet', subtitle }) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ py: 8, color: 'text.secondary' }}>
      <InboxRoundedIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.6 }} />
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
};
