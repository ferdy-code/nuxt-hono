import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { contentIdeas } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import type { Variables } from '../types'

const router = new Hono<{ Variables: Variables }>()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  const { status, platform } = c.req.query()

  const conditions = [eq(contentIdeas.userId, user.id)]
  if (status) conditions.push(eq(contentIdeas.status, status))
  if (platform) conditions.push(eq(contentIdeas.platform, platform))

  const ideas = await db.query.contentIdeas.findMany({
    where: and(...conditions),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })
  return c.json(ideas)
})

router.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const now = new Date()
  const id = crypto.randomUUID()

  await db.insert(contentIdeas).values({
    id,
    userId: user.id,
    title: body.title,
    description: body.description ?? null,
    tags: body.tags ?? null,
    platform: body.platform ?? null,
    status: 'saved',
    createdAt: now,
    updatedAt: now,
  })

  const idea = await db.query.contentIdeas.findFirst({
    where: eq(contentIdeas.id, id),
  })
  return c.json(idea, 201)
})

router.put('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = await c.req.json()

  const existing = await db.query.contentIdeas.findFirst({
    where: and(eq(contentIdeas.id, id), eq(contentIdeas.userId, user.id)),
  })
  if (!existing) return c.json({ error: 'Tidak ditemukan' }, 404)

  await db.update(contentIdeas)
    .set({
      title: body.title ?? existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      tags: body.tags !== undefined ? body.tags : existing.tags,
      platform: body.platform !== undefined ? body.platform : existing.platform,
      status: body.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(contentIdeas.id, id))

  const updated = await db.query.contentIdeas.findFirst({
    where: eq(contentIdeas.id, id),
  })
  return c.json(updated)
})

router.delete('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const existing = await db.query.contentIdeas.findFirst({
    where: and(eq(contentIdeas.id, id), eq(contentIdeas.userId, user.id)),
  })
  if (!existing) return c.json({ error: 'Tidak ditemukan' }, 404)

  await db.delete(contentIdeas).where(eq(contentIdeas.id, id))
  return c.json({ success: true })
})

export { router as ideasRouter }
