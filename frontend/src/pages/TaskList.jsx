import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, InputAdornment, MenuItem, Stack, TextField } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PageHeader from '../components/common/PageHeader';
import TaskTable from '../components/tasks/TaskTable';
import ErrorState from '../components/common/ErrorState';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { useDebounce } from '../hooks/useDebounce';
import { TASK_STATUS_LABEL } from '../utils/constants';

export default function TaskList() {
  const { isPM } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await taskService.list({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status || undefined,
      });
      setTasks(res.data.tasks);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Any filter change resets to page 1 so the user isn't stranded on an empty page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  return (
    <>
      <PageHeader
        title={isPM ? 'All Tasks' : 'My Tasks'}
        subtitle={isPM ? 'Every task across the organisation.' : 'Tasks assigned to you.'}
        action={
          isPM && (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/tasks/new')}>
              New Task
            </Button>
          )
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          placeholder="Search by title…"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField select label="Status" size="small" sx={{ minWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <MenuItem value="">All statuses</MenuItem>
          {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <TaskTable
          tasks={tasks}
          pagination={pagination}
          loading={loading}
          onPageChange={setPage}
          onRowsPerPageChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          showEngineer={isPM}
        />
      )}
    </>
  );
}
