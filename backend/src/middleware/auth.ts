import { createMiddleware } from 'hono/factory'
import { auth } from '../auth'
import type { Variables } from '../types'

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: 'Tidak diizinkan' }, 401)
  }
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
})
