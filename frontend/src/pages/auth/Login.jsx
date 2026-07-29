import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, Link, Stack, TextField, Typography, Alert } from '@mui/material';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const schema = yup.object({
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name}!`);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={0.5}>
        <Typography variant="h6" fontWeight={700}>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Access your PM or Engineer dashboard.
        </Typography>
      </Stack>

      {serverError && <Alert severity="error">{serverError}</Alert>}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        fullWidth
        {...register('email')}
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        fullWidth
        {...register('password')}
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
      />

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Engineer without an account?{' '}
        <Link component={RouterLink} to="/register">
          Register here
        </Link>
      </Typography>
    </Stack>
  );
}
