import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const schema = yup.object({
  name: yup.string().trim().required('Name is required').max(120),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .matches(STRONG_PASSWORD_REGEX, 'At least 8 characters, incl. uppercase, lowercase, number and special character'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
});

/** Public self-registration — always creates an ENGINEER account (see backend authService). */
export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ name, email, password }) => {
    setServerError('');
    try {
      const user = await registerUser({ name, email, password });
      toast.success(`Account created — welcome, ${user.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={0.5}>
        <Typography variant="h6" fontWeight={700}>
          Engineer registration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          PM accounts are provisioned separately by an administrator.
        </Typography>
      </Stack>

      {serverError && <Alert severity="error">{serverError}</Alert>}

      <TextField label="Full name" fullWidth {...register('name')} error={Boolean(errors.name)} helperText={errors.name?.message} />
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
        autoComplete="new-password"
        fullWidth
        {...register('password')}
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
      />
      <TextField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        fullWidth
        {...register('confirmPassword')}
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword?.message}
      />

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Already have an account?{' '}
        <Link component={RouterLink} to="/login">
          Sign in
        </Link>
      </Typography>
    </Stack>
  );
}
