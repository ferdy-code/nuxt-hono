import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { batchJobs, contentItems, userSettings } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { generateIdeasStream, generateOutlineStream } from '../services/ai'
import type { Variables } from '../types'

const router = new Hono<{ Variables: Variables }>()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  const jobs = await db.query.batchJobs.findMany({
    where: eq(batchJobs.userId, user.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })
  return c.json(jobs)
})

router.get('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const job = await db.query.batchJobs.findFirst({
    where: and(eq(batchJobs.id, id), eq(batchJobs.userId, user.id)),
  })
  if (!job) return c.json({ error: 'Tidak ditemukan' }, 404)
  return c.json(job)
})

router.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const now = new Date()
  const jobId = crypto.randomUUID()

  const topics: string[] = body.topics ?? []
  const jobType: string = body.jobType ?? 'ideas'
  const platform: string = body.platform ?? 'blog'

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  })
  const tone = body.tone ?? settings?.tone ?? 'casual'
  const style = settings?.style ?? 'artikel'

  await db.insert(batchJobs).values({
    id: jobId,
    userId: user.id,
    jobType,
    status: 'processing',
    totalItems: topics.length,
    completedItems: 0,
    params: JSON.stringify({ topics, platform, tone }),
    results: JSON.stringify([]),
    createdAt: now,
    updatedAt: now,
  })

  // Process in background (fire and forget)
  processBatchJob(jobId, user.id, jobType, topics, platform, tone, style).catch(async (err) => {
    console.error('Batch job failed:', err)
    await db.update(batchJobs)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(batchJobs.id, jobId))
  })

  const job = await db.query.batchJobs.findFirst({
    where: eq(batchJobs.id, jobId),
  })
  return c.json(job, 201)
})

async function processBatchJob(
  jobId: string,
  userId: string,
  jobType: string,
  topics: string[],
  platform: string,
  tone: string,
  style: string,
) {
  const resultIds: string[] = []

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    let fullText = ''

    try {
      if (jobType === 'ideas') {
        const stream = generateIdeasStream({ topic, count: 3, platform, tone, style })
        for await (const chunk of stream) {
          fullText += chunk
        }
      }
      else if (jobType === 'outlines') {
        const stream = generateOutlineStream({ topic, targetLength: 'medium', tone, style })
        for await (const chunk of stream) {
          fullText += chunk
        }
      }

      const now = new Date()
      const itemId = crypto.randomUUID()
      await db.insert(contentItems).values({
        id: itemId,
        userId,
        ideaId: null,
        parentId: null,
        title: `[Batch] ${topic}`,
        body: fullText,
        contentType: jobType === 'outlines' ? 'outline' : 'article',
        status: 'draft',
        platform,
        metadata: null,
        scheduledAt: null,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      resultIds.push(itemId)
    }
    catch (err) {
      console.error(`Batch item ${i} failed:`, err)
    }

    await db.update(batchJobs)
      .set({
        completedItems: i + 1,
        results: JSON.stringify(resultIds),
        updatedAt: new Date(),
      })
      .where(eq(batchJobs.id, jobId))
  }

  await db.update(batchJobs)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(batchJobs.id, jobId))
}

export { router as batchRouter }
