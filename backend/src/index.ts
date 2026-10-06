import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './auth'
import { aiRouter } from './routes/ai'
import { batchRouter } from './routes/batch'
import { calendarRouter } from './routes/calendar'
import { contentRouter } from './routes/content'
import { exportRouter } from './routes/export'
import { ideasRouter } from './routes/ideas'
import { settingsRouter } from './routes/settings'
import type { Variables } from './types'

const app = new Hono<{ Variables: Variables }>()

const corsOptions = {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}

app.use('/api/*', cors(corsOptions))
app.on(['POST', 'GET'], '/api/auth/*', c => auth.handler(c.req.raw))

app.route('/api/settings', settingsRouter)
app.route('/api/content/ideas', ideasRouter)
app.route('/api/content/items', contentRouter)
app.route('/api/ai', aiRouter)
app.route('/api/calendar', calendarRouter)
app.route('/api/batch', batchRouter)
app.route('/api/export', exportRouter)

export default { port: 3001, fetch: app.fetch }
