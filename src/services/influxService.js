import api from './api';

export const influxService = {
  getSummary: () => api.get('/dashboard/summary'),
  getVehicles: () => api.get('/dashboard/vehicles'),
  getFuelRealtime: (vehicleId) => api.get(`/dashboard/vehicle/${vehicleId}/fuel-realtime`),
  getFuelWeekly: (vehicleId) => api.get(`/dashboard/vehicle/${vehicleId}/fuel-weekly`),
  getHistory: (params) => api.get('/dashboard/history', { params }),
  getStatistics: (params) => api.get('/dashboard/statistics', { params }),
};

export default influxService;
