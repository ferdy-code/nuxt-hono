import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { contentItems, userSettings } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { exportToNotion } from '../services/notion'
import type { Variables } from '../types'

const router = new Hono<{ Variables: Variables }>()
router.use('*', authMiddleware)

router.get('/:id/markdown', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const item = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
  })
  if (!item) return c.json({ error: 'Tidak ditemukan' }, 404)

  const markdown = `# ${item.title}\n\n${item.body ?? ''}`
  const filename = item.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()

  c.header('Content-Type', 'text/markdown; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="${filename}.md"`)
  return c.body(markdown)
})

router.post('/:id/notion', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [item, settings] = await Promise.all([
    db.query.contentItems.findFirst({
      where: and(eq(contentItems.id, id), eq(contentItems.userId, user.id)),
    }),
    db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id),
    }),
  ])

  if (!item) return c.json({ error: 'Tidak ditemukan' }, 404)
  if (!settings?.notionToken || !settings?.notionDatabaseId) {
    return c.json({ error: 'Notion token dan database ID belum diatur di Pengaturan' }, 400)
  }

  try {
    const result = await exportToNotion({
      notionToken: settings.notionToken,
      databaseId: settings.notionDatabaseId,
      title: item.title,
      body: item.body ?? '',
    })
    return c.json({ notionPageUrl: result.url, notionPageId: result.id })
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal ekspor ke Notion'
    return c.json({ error: message }, 500)
  }
})

export { router as exportRouter }
