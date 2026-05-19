import { api } from './client'

export { api }

export const getOrders = (params) => api.get('/orders', { params })
export const getOrderStats = () => api.get('/orders/stats')
export const getOrder = (id) => api.get(`/orders/${id}`)
export const getOrderSlots = (id) => api.get(`/orders/${id}/slots`)
export const createOrder = (data) => api.post('/orders', data)
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data)
export const cancelOrder = (id) => api.delete(`/orders/${id}`)
export const getOrderHistory = (id) => api.get(`/orders/${id}/history`)
export const getCustomers = () => api.get('/customers')
export const triggerRescheduleAll = () => api.post('/scheduling/reschedule-all')
