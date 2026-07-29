import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import ErrorState from '../components/common/ErrorState';
import StatusChip from '../components/common/StatusChip';
import UserAvatar from '../components/common/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { formatDateTime } from '../utils/dateFormat';
import { TASK_STATUS_LABEL } from '../utils/constants';

const estimateSchema = yup.object({
  estimateDays: yup
    .number()
    .typeError('Estimate must be a number')
    .required('Estimate is required')
    .test('not-zero-integer-only', 'Estimate must be a number (fractional and negative values are supported)', (v) => v !== undefined),
});

/**
 * Single reusable Task Details screen. What it renders is driven by role:
 *  - PM: reassign engineer, edit title/description/status, enter a start
 *    date & time and trigger the backend calculation engine.
 *  - Engineer (only if the task is assigned to them): submit/update their
 *    fractional working-day estimate.
 * The end-date math itself never runs here — only the backend computes it.
 */
export default function TaskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPM, isEngineer, user } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [engineers, setEngineers] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [startDate, setStartDate] = useState(dayjs());
  const [startTime, setStartTime] = useState(dayjs().hour(8).minute(0));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await taskService.getById(id);
      setTask(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isPM) {
      userService
        .listEngineers()
        .then((res) => setEngineers(res.data))
        .catch(() => setEngineers([]));
    }
  }, [isPM]);

  const canSubmitEstimate = isEngineer && task && task.assignedEngineer === user.id;

  const estimateForm = useForm({
    resolver: yupResolver(estimateSchema),
    values: { estimateDays: task?.estimateDays ?? '' },
  });

  const editForm = useForm({
    values: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'PENDING',
    },
  });

  const handleAssign = async (engineerId) => {
    try {
      const res = await taskService.assign(id, engineerId);
      setTask(res.data);
      toast.success('Engineer assigned');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditSave = async (values) => {
    try {
      const res = await taskService.update(id, values);
      setTask(res.data);
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEstimateSubmit = async ({ estimateDays }) => {
    try {
      const res = await taskService.submitEstimate(id, Number(estimateDays));
      setTask(res.data);
      toast.success('Estimate submitted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCalculate = async () => {
    if (!startDate || !startTime) return;
    const combined = startDate.hour(startTime.hour()).minute(startTime.minute()).second(0).millisecond(0);
    setCalculating(true);
    try {
      const res = await taskService.calculate(id, combined.toISOString());
      setTask(res.data);
      toast.success('End date calculated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width={280} height={40} />
        <Skeleton variant="rounded" height={220} />
        <Skeleton variant="rounded" height={160} />
      </Stack>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!task) return null;

  return (
    <>
      <PageHeader
        title={task.title}
        subtitle={`Task #${task.id}`}
        action={<StatusChip status={task.status} size="medium" />}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {task.description || 'No description provided.'}
            </Typography>

            <Divider sx={{ my: 2.5 }} />

            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Engineer
                </Typography>
                {task.engineer ? (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <UserAvatar name={task.engineer.name} profileImage={task.engineer.profileImage} size={24} />
                    <Typography variant="body2" fontWeight={600}>
                      {task.engineer.name}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" fontWeight={600}>
                    Unassigned
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Estimate (days)
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {task.estimateDays ?? '—'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Start
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatDateTime(task.startDateTime)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Calculated End
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatDateTime(task.calculatedEndDateTime)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {canSubmitEstimate && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Submit Your Estimate
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your effort estimate in fractional working days. Negative values are supported (e.g. to
                represent time already spent before the official start).
              </Typography>
              <Stack
                component="form"
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                onSubmit={estimateForm.handleSubmit(handleEstimateSubmit)}
              >
                <TextField
                  label="Estimate (days)"
                  type="number"
                  inputProps={{ step: 'any' }}
                  sx={{ minWidth: 200 }}
                  {...estimateForm.register('estimateDays')}
                  error={Boolean(estimateForm.formState.errors.estimateDays)}
                  helperText={estimateForm.formState.errors.estimateDays?.message || 'e.g. 3.25, 5.75, -6.7470217'}
                />
                <Button type="submit" variant="contained" disabled={estimateForm.formState.isSubmitting} sx={{ height: 56 }}>
                  Save Estimate
                </Button>
              </Stack>
            </Paper>
          )}
        </Grid>

        {isPM && (
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 3, mb: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Assignment &amp; Editing
              </Typography>
              <Stack spacing={2} component="form" onSubmit={editForm.handleSubmit(handleEditSave)}>
                <TextField label="Title" fullWidth {...editForm.register('title')} />
                <TextField label="Description" fullWidth multiline minRows={3} {...editForm.register('description')} />
                <Controller
                  name="status"
                  control={editForm.control}
                  render={({ field }) => (
                    <TextField {...field} select label="Status" fullWidth>
                      {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <TextField
                  select
                  label="Assigned Engineer"
                  fullWidth
                  value={task.assignedEngineer || ''}
                  onChange={(e) => handleAssign(e.target.value)}
                >
                  <MenuItem value="" disabled>
                    Select an engineer
                  </MenuItem>
                  {engineers.map((eng) => (
                    <MenuItem key={eng.id} value={eng.id} sx={{ gap: 1.25 }}>
                      <UserAvatar name={eng.name} profileImage={eng.profileImage} size={26} />
                      {eng.name} ({eng.email})
                    </MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="outlined" disabled={editForm.formState.isSubmitting}>
                  Save Changes
                </Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Calculate End Date
              </Typography>
              {!task.estimateDays && task.estimateDays !== 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Waiting for the assigned engineer to submit an estimate before this can be calculated.
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This calls the backend calculation engine — the end date is never computed in the browser.
                </Typography>
              )}

              <Stack spacing={2}>
                <DatePicker label="Start Date" value={startDate} onChange={setStartDate} slotProps={{ textField: { fullWidth: true } }} />
                <TimePicker label="Start Time" value={startTime} onChange={setStartTime} slotProps={{ textField: { fullWidth: true } }} />
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<CalculateRoundedIcon />}
                  disabled={calculating || (!task.estimateDays && task.estimateDays !== 0)}
                  onClick={handleCalculate}
                >
                  {calculating ? 'Calculating…' : 'Calculate End Date'}
                </Button>
              </Stack>

              {task.calculatedEndDateTime && (
                <Box sx={{ mt: 2.5 }}>
                  <Chip
                    color="secondary"
                    variant="outlined"
                    label={`Result: ${formatDateTime(task.calculatedEndDateTime)}`}
                    sx={{ width: '100%', py: 2.5, fontSize: 14 }}
                  />
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Button variant="text" onClick={() => navigate('/tasks')}>
          ← Back to Tasks
        </Button>
      </Box>
    </>
  );
}
