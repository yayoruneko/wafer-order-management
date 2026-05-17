// Frontend-only mock user store. Replaces real /api/users endpoints until the
// backend exposes them. Persists to localStorage so role edits survive reload.

const STORAGE_KEY = 'woms.mockUsers.v1'

const SEED_USERS = [
  {
    id: 'user-super-001',
    username: 'super',
    displayName: 'Super Admin',
    role: 'SUPER_ADMIN',
    createdAt: '2025-01-04T08:00:00.000Z',
  },
  {
    id: 'user-admin-001',
    username: 'admin',
    displayName: 'Alex Admin',
    role: 'ADMIN',
    createdAt: '2025-02-12T08:00:00.000Z',
  },
  {
    id: 'user-viewer-001',
    username: 'taylor',
    displayName: 'Taylor Hsu',
    role: 'VIEWER',
    createdAt: '2025-03-19T08:00:00.000Z',
  },
  {
    id: 'user-viewer-002',
    username: 'morgan',
    displayName: 'Morgan Lin',
    role: 'VIEWER',
    createdAt: '2025-04-02T08:00:00.000Z',
  },
  {
    id: 'user-admin-002',
    username: 'jamie',
    displayName: 'Jamie Wu',
    role: 'ADMIN',
    createdAt: '2025-04-21T08:00:00.000Z',
  },
]

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch {
    // ignore quota errors
  }
}

function ensureSeed() {
  const existing = loadUsers()
  if (existing && existing.length > 0) return existing
  saveUsers(SEED_USERS)
  return SEED_USERS
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export async function listUsers() {
  await wait(180)
  return ensureSeed()
}

export async function updateUserRole(userId, nextRole) {
  await wait(220)
  const users = ensureSeed()
  const target = users.find((u) => u.id === userId)
  if (!target) {
    const err = new Error('User not found')
    err.response = { status: 404 }
    throw err
  }
  if (target.role === 'SUPER_ADMIN') {
    const err = new Error('Cannot change role of a super admin')
    err.response = { status: 400 }
    throw err
  }
  if (!['ADMIN', 'VIEWER'].includes(nextRole)) {
    const err = new Error('Invalid role')
    err.response = { status: 400 }
    throw err
  }
  const updated = users.map((u) =>
    u.id === userId ? { ...u, role: nextRole } : u,
  )
  saveUsers(updated)
  return updated.find((u) => u.id === userId)
}
