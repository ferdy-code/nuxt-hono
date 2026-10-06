import { Hono } from 'hono'
import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '../db'
import { calendarEvents } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import type { Variables } from '../types'

const router = new Hono<{ Variables: Variables }>()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  const { month, year } = c.req.query()

  const conditions = [eq(calendarEvents.userId, user.id)]

  if (month && year) {
    const m = Number.parseInt(month)
    const y = Number.parseInt(year)
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0, 23, 59, 59)
    conditions.push(gte(calendarEvents.scheduledDate, start))
    conditions.push(lte(calendarEvents.scheduledDate, end))
  }

  const events = await db.query.calendarEvents.findMany({
    where: and(...conditions),
    orderBy: (t, { asc }) => [asc(t.scheduledDate)],
  })
  return c.json(events)
})

router.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const now = new Date()
  const id = crypto.randomUUID()

  await db.insert(calendarEvents).values({
    id,
    userId: user.id,
    contentItemId: body.contentItemId ?? null,
    title: body.title,
    scheduledDate: new Date(body.scheduledDate),
    platform: body.platform ?? null,
    status: 'scheduled',
    notes: body.notes ?? null,
    createdAt: now,
    updatedAt: now,
  })

  const event = await db.query.calendarEvents.findFirst({
    where: eq(calendarEvents.id, id),
  })
  return c.json(event, 201)
})

router.put('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = await c.req.json()

  const existing = await db.query.calendarEvents.findFirst({
    where: and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)),
  })
  if (!existing) return c.json({ error: 'Tidak ditemukan' }, 404)

  await db.update(calendarEvents)
    .set({
      title: body.title ?? existing.title,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : existing.scheduledDate,
      platform: body.platform !== undefined ? body.platform : existing.platform,
      status: body.status ?? existing.status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      contentItemId: body.contentItemId !== undefined ? body.contentItemId : existing.contentItemId,
      updatedAt: new Date(),
    })
    .where(eq(calendarEvents.id, id))

  const updated = await db.query.calendarEvents.findFirst({
    where: eq(calendarEvents.id, id),
  })
  return c.json(updated)
})

router.delete('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const existing = await db.query.calendarEvents.findFirst({
    where: and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)),
  })
  if (!existing) return c.json({ error: 'Tidak ditemukan' }, 404)

  await db.delete(calendarEvents).where(eq(calendarEvents.id, id))
  return c.json({ success: true })
})

export { router as calendarRouter }
