import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { userSettings } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import type { Variables } from '../types'

const router = new Hono<{ Variables: Variables }>()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  let settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  })
  if (!settings) {
    const id = crypto.randomUUID()
    const now = new Date()
    await db.insert(userSettings).values({
      id,
      userId: user.id,
      tone: 'casual',
      style: 'artikel',
      language: 'id',
      createdAt: now,
      updatedAt: now,
    })
    settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id),
    })
  }
  return c.json(settings)
})

router.put('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const now = new Date()

  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  })

  if (!existing) {
    const id = crypto.randomUUID()
    await db.insert(userSettings).values({
      id,
      userId: user.id,
      tone: body.tone ?? 'casual',
      style: body.style ?? 'artikel',
      language: body.language ?? 'id',
      notionToken: body.notionToken ?? null,
      notionDatabaseId: body.notionDatabaseId ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }
  else {
    await db.update(userSettings)
      .set({
        tone: body.tone ?? existing.tone,
        style: body.style ?? existing.style,
        language: body.language ?? existing.language,
        notionToken: body.notionToken !== undefined ? body.notionToken : existing.notionToken,
        notionDatabaseId: body.notionDatabaseId !== undefined ? body.notionDatabaseId : existing.notionDatabaseId,
        updatedAt: now,
      })
      .where(eq(userSettings.userId, user.id))
  }

  const updated = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  })
  return c.json(updated)
})

export { router as settingsRouter }
