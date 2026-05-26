import { api } from './orderApi'

export const getCustomers = () => api.get('/customers')
export const createCustomer = (data) => api.post('/customers', data)