import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Button, Paper, MenuItem, Stack, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import UserAvatar from '../components/common/UserAvatar';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';

const schema = yup.object({
  title: yup.string().trim().required('Title is required').max(200),
  description: yup.string().trim().max(5000).nullable(),
  assignedEngineer: yup.string().nullable(),
});

/** PM-only: create a task and optionally assign an engineer up front. */
export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState([]);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema), defaultValues: { title: '', description: '', assignedEngineer: '' } });

  useEffect(() => {
    userService
      .listEngineers()
      .then((res) => setEngineers(res.data))
      .catch(() => setEngineers([]));
  }, []);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const res = await taskService.create({
        title: values.title,
        description: values.description || undefined,
        assignedEngineer: values.assignedEngineer || undefined,
      });
      toast.success('Task created');
      navigate(`/tasks/${res.data.id}`);
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Create Task" subtitle="Define the work and optionally assign it to an engineer." />

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 640 }}>
        <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <TextField
            label="Title"
            fullWidth
            {...register('title')}
            error={Boolean(errors.title)}
            helperText={errors.title?.message}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={4}
            {...register('description')}
            error={Boolean(errors.description)}
            helperText={errors.description?.message}
          />

          <Controller
            name="assignedEngineer"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Assign Engineer (optional)" fullWidth>
                <MenuItem value="">— Unassigned —</MenuItem>
                {engineers.map((eng) => (
                  <MenuItem key={eng.id} value={eng.id} sx={{ gap: 1.25 }}>
                    <UserAvatar name={eng.name} profileImage={eng.profileImage} size={26} />
                    {eng.name} ({eng.email})
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="text" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Task'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
