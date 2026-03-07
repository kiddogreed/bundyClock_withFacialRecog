import api from './axiosClient'

export const getShifts = () => api.get('/shifts')
