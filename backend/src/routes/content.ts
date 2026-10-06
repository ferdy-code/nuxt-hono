import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { contentComments, contentItems } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import type { Variables } from '../types'

const router = new Hono<{ Variables: Variables }>()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  const { status, contentType, platform } = c.req.query()

  const conditions = [eq(contentItems.userId, user.id)]
  if (status) conditions.push(eq(contentItems.status, status))
  if (contentType) conditions.push(eq(contentItems.contentType, contentType))
  if (platform) conditions.push(eq(contentItems.platform, platform))

  const items = await db.query.contentItems.findMany({
    where: and(...conditions),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })
  return c.json(items)
})

router.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const now = new Date()
  const id = crypto.randomUUID()

  await db.insert(contentItems).values({
    id,
    userId: user.id,
    ideaId: body.ideaId ?? null,
    parentId: body.parentId ?? null,
    title: body.title,
    body: body.body ?? null,
    contentType: body.contentType,
    status: 'draft',
    platform: body.platform ?? null,
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  })

  const item = await db.query.contentItems.findFirst({
    where: eq(contentItems.id, id),
  })
  return c.json(item, 201)
})

router.get('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const item = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
  })
  if (!item) return c.json({ error: 'Tidak ditemukan' }, 404)
  return c.json(item)
})

router.put('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = await c.req.json()

  const existing = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
  })
  if (!existing) return c.json({ error: 'Tidak ditemukan' }, 404)

  await db.update(contentItems)
    .set({
      title: body.title ?? existing.title,
      body: body.body !== undefined ? body.body : existing.body,
      platform: body.platform !== undefined ? body.platform : existing.platform,
      metadata: body.metadata !== undefined ? JSON.stringify(body.metadata) : existing.metadata,
      scheduledAt: body.scheduledAt !== undefined ? (body.scheduledAt ? new Date(body.scheduledAt) : null) : existing.scheduledAt,
      updatedAt: new Date(),
    })
    .where(eq(contentItems.id, id))

  const updated = await db.query.contentItems.findFirst({
    where: eq(contentItems.id, id),
  })
  return c.json(updated)
})

router.delete('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const existing = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
  })
  if (!existing) return c.json({ error: 'Tidak ditemukan' }, 404)

  await db.delete(contentItems).where(eq(contentItems.id, id))
  return c.json({ success: true })
})

router.post('/:id/submit', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const existing = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
  })
  if (!existing) return c.json({ error: 'Tidak ditemukan' }, 404)

  await db.update(contentItems)
    .set({ status: 'pending_review', updatedAt: new Date() })
    .where(eq(contentItems.id, id))

  return c.json({ success: true, status: 'pending_review' })
})

router.post('/:id/approve', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const existing = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
  })
  if (!existing) return c.json({ error: 'Tidak ditemukan' }, 404)

  await db.update(contentItems)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(eq(contentItems.id, id))

  return c.json({ success: true, status: 'approved' })
})

router.post('/:id/reject', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = await c.req.json().catch(() => ({}))

  const existing = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
  })
  if (!existing) return c.json({ error: 'Tidak ditemukan' }, 404)

  await db.update(contentItems)
    .set({ status: 'rejected', updatedAt: new Date() })
    .where(eq(contentItems.id, id))

  if (body.reason) {
    const now = new Date()
    await db.insert(contentComments).values({
      id: crypto.randomUUID(),
      contentItemId: id,
      userId: user.id,
      comment: `[Ditolak] ${body.reason}`,
      createdAt: now,
      updatedAt: now,
    })
  }

  return c.json({ success: true, status: 'rejected' })
})

router.get('/:id/comments', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const item = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
  })
  if (!item) return c.json({ error: 'Tidak ditemukan' }, 404)

  const comments = await db.query.contentComments.findMany({
    where: eq(contentComments.contentItemId, id),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  })
  return c.json(comments)
})

router.post('/:id/comments', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = await c.req.json()

  const item = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
  })
  if (!item) return c.json({ error: 'Tidak ditemukan' }, 404)

  const now = new Date()
  const commentId = crypto.randomUUID()
  await db.insert(contentComments).values({
    id: commentId,
    contentItemId: id,
    userId: user.id,
    comment: body.comment,
    createdAt: now,
    updatedAt: now,
  })

  const comment = await db.query.contentComments.findFirst({
    where: eq(contentComments.id, commentId),
  })
  return c.json(comment, 201)
})

export { router as contentRouter }
