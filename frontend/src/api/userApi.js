import { api } from './client'

function mapUser(u) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.username,
    role: u.role,
    createdAt: u.createdAt,
  }
}

export async function listUsers() {
  const { data } = await api.get('/users')
  return data.map(mapUser)
}

export async function updateUserRole(userId, nextRole) {
  await api.patch(`/users/${userId}/role`, { role: nextRole })
  return { id: userId, role: nextRole }
}
