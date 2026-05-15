import { api } from './orderApi'

export const getCustomers = () => api.get('/customers')