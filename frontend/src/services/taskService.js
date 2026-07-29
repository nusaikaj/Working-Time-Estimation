import apiClient from './apiClient';

export const taskService = {
  list: (params) => apiClient.get('/tasks', { params }),
  stats: () => apiClient.get('/tasks/stats'),
  getById: (id) => apiClient.get(`/tasks/${id}`),
  create: (payload) => apiClient.post('/tasks', payload),
  update: (id, payload) => apiClient.patch(`/tasks/${id}`, payload),
  assign: (id, assignedEngineer) => apiClient.patch(`/tasks/${id}/assign`, { assignedEngineer }),
  submitEstimate: (id, estimateDays) => apiClient.patch(`/tasks/${id}/estimate`, { estimateDays }),
  calculate: (id, startDateTime) => apiClient.post(`/tasks/${id}/calculate`, { startDateTime }),
};
