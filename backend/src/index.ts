import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './auth'

const app = new Hono()

app.use('/api/auth/*', cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  credentials: true,
}))

app.on(['POST', 'GET'], '/api/auth/*', c => auth.handler(c.req.raw))

export default { port: 3001, fetch: app.fetch }
