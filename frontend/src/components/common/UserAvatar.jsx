import PropTypes from 'prop-types';
import { Avatar } from '@mui/material';

// A small fixed palette (not the MUI theme palette) so initials avatars stay
// legible in both light and dark mode without themselves changing on toggle.
const PALETTE = ['#6366F1', '#14B8A6', '#F59E0B', '#EF4444', '#38BDF8', '#A855F7', '#22C55E', '#EC4899'];

function colorForName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/**
 * Renders a user's profile photo when they have one, otherwise falls back to
 * a colored circle with their initial — the color is derived from their name
 * so the same person always gets the same fallback color across the app.
 */
export default function UserAvatar({ name, profileImage, size = 36, sx = {} }) {
  if (profileImage) {
    return <Avatar src={profileImage} alt={name} sx={{ width: size, height: size, ...sx }} />;
  }

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: colorForName(name),
        fontSize: size * 0.42,
        fontWeight: 700,
        ...sx,
      }}
    >
      {name?.charAt(0)?.toUpperCase() || '?'}
    </Avatar>
  );
}

UserAvatar.propTypes = {
  name: PropTypes.string,
  profileImage: PropTypes.string,
  size: PropTypes.number,
  sx: PropTypes.object,
};
