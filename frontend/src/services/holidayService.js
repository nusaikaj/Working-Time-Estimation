import apiClient from './apiClient';

export const holidayService = {
  listRecurring: () => apiClient.get('/holidays/recurring'),
  addRecurring: (payload) => apiClient.post('/holidays/recurring', payload),
  removeRecurring: (id) => apiClient.delete(`/holidays/recurring/${id}`),
  listOneTime: () => apiClient.get('/holidays/one-time'),
  addOneTime: (payload) => apiClient.post('/holidays/one-time', payload),
  removeOneTime: (id) => apiClient.delete(`/holidays/one-time/${id}`),
};
