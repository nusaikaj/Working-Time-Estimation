import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Chip, Divider, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import UserAvatar from '../components/common/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Self-service profile screen: available to both PM and Engineer accounts. */
export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ defaultValues: { name: user.name } });

  const onSaveName = async ({ name }) => {
    try {
      const res = await userService.updateMe({ name });
      updateUser(res.data);
      toast.success('Name updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, WEBP or GIF images are allowed');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Image must be 3MB or smaller');
      return;
    }

    setUploading(true);
    try {
      const res = await userService.uploadAvatar(file);
      updateUser(res.data);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      const res = await userService.removeAvatar();
      updateUser(res.data);
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Update your photo and display name." />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <UserAvatar name={user.name} profileImage={user.profileImage} size={120} />
              <Button
                size="small"
                variant="contained"
                onClick={handlePickPhoto}
                disabled={uploading}
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  minWidth: 0,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  boxShadow: 3,
                }}
              >
                <PhotoCameraRoundedIcon fontSize="small" />
              </Button>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={handleFileChange}
            />

            <Typography variant="h6" fontWeight={700}>
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user.email}
            </Typography>
            <Chip size="small" label={user.role} color={user.role === 'PM' ? 'primary' : 'secondary'} sx={{ mt: 1 }} />

            {user.profileImage && (
              <Stack direction="row" justifyContent="center" sx={{ mt: 2.5 }}>
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                >
                  Remove photo
                </Button>
              </Stack>
            )}

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
              JPEG, PNG, WEBP or GIF — up to 3MB.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 4 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Display Name
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSaveName)} sx={{ maxWidth: 420 }}>
              <TextField
                label="Full name"
                fullWidth
                {...register('name', { required: 'Name is required', maxLength: 120 })}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
              <TextField label="Email" fullWidth value={user.email} disabled helperText="Email cannot be changed here." />
              <Box>
                <Button type="submit" variant="contained" disabled={isSubmitting || !isDirty}>
                  Save Changes
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
