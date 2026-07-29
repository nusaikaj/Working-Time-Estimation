import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Button, Stack, Typography } from '@mui/material';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import TaskTable from '../components/tasks/TaskTable';
import ErrorState from '../components/common/ErrorState';
import UserAvatar from '../components/common/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { isPM, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, tasksRes] = await Promise.all([
        taskService.stats(),
        taskService.list({ page: 1, limit: 5 }),
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.tasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          p: { xs: 3, sm: 4 },
          mb: 3.5,
          background: 'linear-gradient(120deg, #4338CA 0%, #6366F1 45%, #14B8A6 100%)',
          color: '#fff',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            top: -80,
            right: -60,
          }}
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ position: 'relative' }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <UserAvatar name={user.name} profileImage={user.profileImage} size={56} sx={{ border: '2px solid rgba(255,255,255,0.6)' }} />
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {greetingForNow()}, {user.name.split(' ')[0]}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {isPM ? 'Here is what is happening across the team.' : 'Here is a summary of your assigned work.'}
              </Typography>
            </Box>
          </Stack>
          {isPM && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate('/tasks/new')}
              sx={{
                bgcolor: '#fff',
                color: 'primary.dark',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              New Task
            </Button>
          )}
        </Stack>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={isPM ? 3 : 4}>
          <StatCard label="Total Tasks" value={stats?.total ?? 0} icon={FormatListBulletedRoundedIcon} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={isPM ? 3 : 4}>
          <StatCard label="Completed" value={stats?.completed ?? 0} icon={AssignmentTurnedInRoundedIcon} color="success" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={isPM ? 3 : 4}>
          <StatCard label="Pending" value={stats?.pending ?? 0} icon={PendingActionsRoundedIcon} color="warning" loading={loading} />
        </Grid>
        {isPM && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard label="Engineers" value={stats?.engineers ?? 0} icon={GroupsRoundedIcon} color="secondary" loading={loading} />
          </Grid>
        )}
      </Grid>

      <PageHeader title="Recent Tasks" />
      <TaskTable
        tasks={recentTasks}
        loading={loading}
        pagination={null}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
        showEngineer={isPM}
      />
    </>
  );
}
