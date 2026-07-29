import apiClient from './apiClient';

export const settingsService = {
  get: () => apiClient.get('/settings'),
  update: (payload) => apiClient.put('/settings', payload),
};
