import PropTypes from 'prop-types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

/** Blocks unauthenticated users from reaching any nested route. */
export default function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/** Further restricts a subtree to one or more roles; used for PM-only pages. */
export function RoleRoute({ allow }) {
  const { user } = useAuth();

  if (!allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

RoleRoute.propTypes = { allow: PropTypes.arrayOf(PropTypes.string).isRequired };
