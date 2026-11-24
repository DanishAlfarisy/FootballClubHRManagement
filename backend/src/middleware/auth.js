import { createClient } from '@supabase/supabase-js'

export async function authenticate(req, _res, next) {
  try {
    if (process.env.AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
      req.user = { id: 'local-development', role: 'Admin' }
      return next()
    }
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return next(Object.assign(new Error('Authentication required'), { status: 401 }))
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    const { data, error } = await client.auth.getUser(token)
    if (error || !data.user) return next(Object.assign(new Error('Invalid or expired token'), { status: 401 }))
    req.user = data.user
    next()
  } catch (error) { next(error) }
}

export const allowRoles = (...roles) => (req, _res, next) => {
  const role = req.user?.app_metadata?.role || req.user?.role
  return roles.includes(role) ? next() : next(Object.assign(new Error('Insufficient permission'), { status: 403 }))
}