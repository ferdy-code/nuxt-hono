import { Client } from '@notionhq/client'

interface ExportParams {
  notionToken: string
  databaseId: string
  title: string
  body: string
}

function markdownToBlocks(markdown: string) {
  const lines = markdown.split('\n')
  const blocks: object[] = []

  for (const line of lines) {
    if (!line.trim()) continue

    if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.replace('### ', '') } }],
        },
      })
    }
    else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.replace('## ', '') } }],
        },
      })
    }
    else if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.replace('# ', '') } }],
        },
      })
    }
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.replace(/^[-*] /, '') } }],
        },
      })
    }
    else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }],
        },
      })
    }
  }

  return blocks
}

export async function exportToNotion(params: ExportParams) {
  const { notionToken, databaseId, title, body } = params
  const notion = new Client({ auth: notionToken })

  const blocks = markdownToBlocks(body)

  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: title } }],
      },
    },
    children: blocks as Parameters<typeof notion.pages.create>[0]['children'],
  })

  return {
    id: response.id,
    url: (response as { url: string }).url,
  }
}
