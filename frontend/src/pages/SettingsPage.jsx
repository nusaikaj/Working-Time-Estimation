import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import { TimePicker, DatePicker } from '@mui/x-date-pickers';
import {
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { settingsService } from '../services/settingsService';
import { holidayService } from '../services/holidayService';
import { formatDate } from '../utils/dateFormat';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function timeStringToDayjs(value) {
  if (!value) return dayjs().hour(8).minute(0);
  const [h, m] = value.split(':').map(Number);
  return dayjs().hour(h).minute(m).second(0);
}

/** PM-only: working hours + recurring/one-time holidays, all persisted server-side. */
export default function SettingsPage() {
  const [tab, setTab] = useState(0);

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const [recurring, setRecurring] = useState([]);
  const [oneTime, setOneTime] = useState([]);
  const [newOneTimeDate, setNewOneTimeDate] = useState(dayjs());

  const recurringForm = useForm({ defaultValues: { month: 1, day: 1 } });

  const loadSettings = () => {
    setSettingsLoading(true);
    settingsService
      .get()
      .then((res) => {
        setStartTime(timeStringToDayjs(res.data.workingStartTime));
        setEndTime(timeStringToDayjs(res.data.workingEndTime));
      })
      .finally(() => setSettingsLoading(false));
  };

  const loadHolidays = () => {
    holidayService.listRecurring().then((res) => setRecurring(res.data));
    holidayService.listOneTime().then((res) => setOneTime(res.data));
  };

  useEffect(() => {
    loadSettings();
    loadHolidays();
  }, []);

  const handleSaveHours = async () => {
    try {
      await settingsService.update({
        workingStartTime: startTime.format('HH:mm'),
        workingEndTime: endTime.format('HH:mm'),
      });
      toast.success('Working hours updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddRecurring = async (values) => {
    try {
      await holidayService.addRecurring({ month: Number(values.month), day: Number(values.day) });
      toast.success('Recurring holiday added');
      loadHolidays();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveRecurring = async (id) => {
    try {
      await holidayService.removeRecurring(id);
      loadHolidays();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddOneTime = async () => {
    try {
      await holidayService.addOneTime({ holidayDate: newOneTimeDate.format('YYYY-MM-DD') });
      toast.success('One-time holiday added');
      loadHolidays();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveOneTime = async (id) => {
    try {
      await holidayService.removeOneTime(id);
      loadHolidays();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Working hours and holidays used by the calculation engine." />

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Working Hours" />
        <Tab label="Recurring Holidays" />
        <Tab label="One-Time Holidays" />
      </Tabs>

      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
          {!settingsLoading && (
            <Stack spacing={2.5}>
              <TimePicker label="Working Start Time" value={startTime} onChange={setStartTime} slotProps={{ textField: { fullWidth: true } }} />
              <TimePicker label="Working End Time" value={endTime} onChange={setEndTime} slotProps={{ textField: { fullWidth: true } }} />
              <Typography variant="caption" color="text.secondary">
                Example: 08:00 to 16:00 — used everywhere the calculation engine runs.
              </Typography>
              <Button variant="contained" onClick={handleSaveHours}>
                Save Working Hours
              </Button>
            </Stack>
          )}
        </Paper>
      )}

      {tab === 1 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={5} md={4}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Add Recurring Holiday
              </Typography>
              <Stack spacing={2} component="form" onSubmit={recurringForm.handleSubmit(handleAddRecurring)}>
                <Controller
                  name="month"
                  control={recurringForm.control}
                  render={({ field }) => (
                    <TextField {...field} select label="Month" fullWidth>
                      {MONTHS.map((m, i) => (
                        <MenuItem key={m} value={i + 1}>
                          {m}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <TextField
                  label="Day"
                  type="number"
                  fullWidth
                  inputProps={{ min: 1, max: 31 }}
                  {...recurringForm.register('day')}
                />
                <Button type="submit" variant="contained">
                  Add Holiday
                </Button>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={7} md={8}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Repeats every year
              </Typography>
              {recurring.length === 0 ? (
                <EmptyState title="No recurring holidays configured" />
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {recurring.map((h) => (
                    <Chip
                      key={h.id}
                      label={`${String(h.day).padStart(2, '0')} ${MONTHS[h.month - 1]}`}
                      onDelete={() => handleRemoveRecurring(h.id)}
                      deleteIcon={<DeleteRoundedIcon />}
                    />
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tab === 2 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={5} md={4}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Add One-Time Holiday
              </Typography>
              <Stack spacing={2}>
                <DatePicker label="Date" value={newOneTimeDate} onChange={setNewOneTimeDate} slotProps={{ textField: { fullWidth: true } }} />
                <Button variant="contained" onClick={handleAddOneTime}>
                  Add Holiday
                </Button>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={7} md={8}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Specific dates
              </Typography>
              {oneTime.length === 0 ? (
                <EmptyState title="No one-time holidays configured" />
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {oneTime.map((h) => (
                    <Chip
                      key={h.id}
                      label={formatDate(h.holidayDate)}
                      onDelete={() => handleRemoveOneTime(h.id)}
                      deleteIcon={<DeleteRoundedIcon />}
                    />
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </>
  );
}
