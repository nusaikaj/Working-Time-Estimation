import PropTypes from 'prop-types';
import { Card, CardContent, Stack, Typography, Box, Skeleton } from '@mui/material';

/** A single dashboard statistic tile — used for Total/Completed/Pending/Engineers. */
export default function StatCard({ label, value, icon: Icon, color = 'primary', loading = false }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark' ? '0 12px 24px -8px rgba(0,0,0,0.5)' : '0 12px 24px -8px rgba(15,23,42,0.16)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: (theme) => `linear-gradient(90deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
        },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: (theme) => `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
              color: '#fff',
              boxShadow: (theme) => `0 6px 16px -4px ${theme.palette[color].main}80`,
            }}
          >
            <Icon />
          </Box>
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={56} height={36} />
            ) : (
              <Typography variant="h5" fontWeight={800}>
                {value}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  loading: PropTypes.bool,
};
