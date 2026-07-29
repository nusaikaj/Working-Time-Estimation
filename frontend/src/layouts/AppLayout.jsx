import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  ButtonBase,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeModeContext';
import UserAvatar from '../components/common/UserAvatar';

const DRAWER_WIDTH = 264;

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: DashboardRoundedIcon, roles: ['PM', 'ENGINEER'] },
  { label: 'Tasks', to: '/tasks', icon: AssignmentRoundedIcon, roles: ['PM', 'ENGINEER'] },
  { label: 'Settings', to: '/settings', icon: SettingsRoundedIcon, roles: ['PM'] },
];

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login', { replace: true });
  };

  const goToProfile = () => {
    setAnchorEl(null);
    navigate('/profile');
  };

  const drawerContent = (
    <Box display="flex" flexDirection="column" height="100%">
      <Toolbar sx={{ px: 3, gap: 1.25 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366F1 0%, #14B8A6 100%)',
            boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)',
          }}
        >
          <ScheduleIcon sx={{ fontSize: 20, color: '#fff' }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={800} noWrap>
          WTE System
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {visibleItems.map(({ label, to, icon: Icon }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2.5,
              mb: 0.5,
              transition: 'transform 0.15s ease, background-color 0.15s ease',
              '&:hover': { transform: 'translateX(2px)' },
              '&.active': {
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#fff',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.35)',
                '& .MuiListItemIcon-root': { color: '#fff' },
                '&:hover': { transform: 'none' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <ButtonBase
        onClick={() => navigate('/profile')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          justifyContent: 'flex-start',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <UserAvatar name={user.name} profileImage={user.profileImage} size={38} />
        <Box minWidth={0} textAlign="left">
          <Typography variant="body2" fontWeight={700} noWrap>
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user.role === 'PM' ? 'Project Manager' : 'Engineer'}
          </Typography>
        </Box>
      </ButtonBase>
    </Box>
  );

  return (
    <Box display="flex" minHeight="100vh">
      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(18, 26, 43, 0.75)' : 'rgba(255, 255, 255, 0.75)'),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Box flexGrow={1} />
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={toggleMode}>{mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}</IconButton>
          </Tooltip>
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
              <UserAvatar name={user.name} profileImage={user.profileImage} size={34} />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Stack sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Stack>
            <Divider />
            <MenuItem onClick={goToProfile}>
              <ListItemIcon>
                <PersonRoundedIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" flexGrow={1} sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
