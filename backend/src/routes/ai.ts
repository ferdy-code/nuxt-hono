import { stream } from 'hono/streaming'
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { userSettings } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { generateIdeasStream, generateOutlineStream, repurposeStream } from '../services/ai'
import type { Variables } from '../types'

const router = new Hono<{ Variables: Variables }>()
router.use('*', authMiddleware)

router.post('/ideas', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  })

  return stream(c, async (s) => {
    const iter = generateIdeasStream({
      topic: body.topic,
      count: body.count ?? 5,
      platform: body.platform,
      tone: body.tone ?? settings?.tone ?? 'casual',
      style: body.style ?? settings?.style ?? 'artikel',
    })
    for await (const chunk of iter) {
      await s.write(chunk)
    }
  })
})

router.post('/outline', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  })

  return stream(c, async (s) => {
    const iter = generateOutlineStream({
      topic: body.topic,
      targetLength: body.targetLength ?? 'medium',
      tone: body.tone ?? settings?.tone ?? 'casual',
      style: body.style ?? settings?.style ?? 'artikel',
    })
    for await (const chunk of iter) {
      await s.write(chunk)
    }
  })
})

router.post('/repurpose', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  })

  return stream(c, async (s) => {
    const iter = repurposeStream({
      articleContent: body.articleContent,
      platforms: body.platforms ?? ['twitter'],
      tone: body.tone ?? settings?.tone ?? 'casual',
      style: body.style ?? settings?.style ?? 'artikel',
    })
    for await (const chunk of iter) {
      await s.write(chunk)
    }
  })
})

export { router as aiRouter }
