import apiClient from './apiClient';

export const userService = {
  listEngineers: () => apiClient.get('/users/engineers'),
  updateMe: (payload) => apiClient.patch('/users/me', payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.patch('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeAvatar: () => apiClient.delete('/users/me/avatar'),
};
