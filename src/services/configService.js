import api from './api';

// ===================== ALAT =====================
export const alatService = {
    getAll: () => api.get('/alat'),
    getById: (id) => api.get(`/alat/${id}`),
    create: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/alat', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    update: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/alat/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    delete: (id) => api.delete(`/alat/${id}`)
};

// ===================== OPERATOR =====================
export const operatorService = {
    getAll: () => api.get('/operator'),
    getById: (id) => api.get(`/operator/${id}`),
    create: (data) => api.post('/operator', data),
    update: (id, data) => api.put(`/operator/${id}`, data),
    delete: (id) => api.delete(`/operator/${id}`)
};

// ===================== LOKASI =====================
export const lokasiService = {
    getAll: () => api.get('/lokasi'),
    getById: (id) => api.get(`/lokasi/${id}`),
    create: (data) => api.post('/lokasi', data),
    update: (id, data) => api.put(`/lokasi/${id}`, data),
    delete: (id) => api.delete(`/lokasi/${id}`)
};

// ===================== KALIBRASI =====================
export const kalibrasiService = {
    getAll: () => api.get('/kalibrasi'),
    getById: (id) => api.get(`/kalibrasi/${id}`),
    create: (data) => api.post('/kalibrasi', data),
    update: (id, data) => api.put(`/kalibrasi/${id}`, data),
    delete: (id) => api.delete(`/kalibrasi/${id}`)
};

// ===================== PENGAWAS =====================
export const pengawasService = {
    getAll: () => api.get('/pengawas'),
    getById: (id) => api.get(`/pengawas/${id}`),
    create: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/pengawas', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    update: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/pengawas/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    delete: (id) => api.delete(`/pengawas/${id}`)
};
