import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY ?? '',
})
const model = process.env.AI_MODEL ?? ''

async function* streamCompletion(prompt: string): AsyncIterable<string> {
  const stream = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  })
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text)
      yield text
  }
}

interface IdeasParams {
  topic: string
  count: number
  platform?: string
  tone?: string
  style?: string
}

interface OutlineParams {
  topic: string
  targetLength?: string
  tone?: string
  style?: string
}

interface RepurposeParams {
  articleContent: string
  platforms: string[]
  tone?: string
  style?: string
}

export async function* generateIdeasStream(params: IdeasParams): AsyncIterable<string> {
  const { topic, count = 5, platform = 'blog', tone = 'casual', style = 'artikel' } = params

  const prompt = `Kamu adalah ahli strategi konten digital. Buat ${count} ide konten ${platform} tentang topik "${topic}".
Tone: ${tone}. Gaya: ${style}.
Instruksi:
- Jawab dalam Bahasa Indonesia
- Output harus berupa JSON array yang valid
- Setiap item berisi: title (string), description (string, 1-2 kalimat), tags (array of string, 3-5 tag)
- Jangan tambahkan markdown code block, langsung JSON saja
Format: [{"title":"...","description":"...","tags":["...","..."]}]`

  yield* streamCompletion(prompt)
}

export async function* generateOutlineStream(params: OutlineParams): AsyncIterable<string> {
  const { topic, targetLength = 'medium', tone = 'casual', style = 'artikel' } = params

  const lengthMap: Record<string, string> = {
    short: '~500 kata',
    medium: '~1000 kata',
    long: '~2000 kata',
  }
  const targetWords = lengthMap[targetLength] ?? '~1000 kata'

  const prompt = `Kamu adalah penulis konten profesional. Buat outline artikel lengkap tentang "${topic}".
Panjang target: ${targetWords}. Tone: ${tone}. Gaya: ${style}.
Instruksi:
- Jawab dalam Bahasa Indonesia
- Gunakan format Markdown dengan heading H1, H2, H3
- Sertakan poin-poin utama untuk setiap section
- Tambahkan estimasi jumlah kata per section
- Mulai dengan H1 untuk judul artikel`

  yield* streamCompletion(prompt)
}

export async function* repurposeStream(params: RepurposeParams): AsyncIterable<string> {
  const { articleContent, platforms, tone = 'casual', style = 'artikel' } = params

  const platformInstructions: Record<string, string> = {
    twitter: 'Twitter/X post (maks 280 karakter, bisa pakai thread jika perlu, gunakan hashtag relevan)',
    linkedin: 'LinkedIn post (200-300 kata, profesional, dengan hook pembuka yang kuat)',
    instagram: 'Caption Instagram (150-200 kata, engaging, 5-10 hashtag relevan di akhir)',
  }

  for (const platform of platforms) {
    const instruction = platformInstructions[platform] ?? `post ${platform}`
    const prompt = `Buat ${instruction} dari artikel berikut.
Tone: ${tone}. Gaya: ${style}.
Instruksi:
- Jawab dalam Bahasa Indonesia
- Sesuaikan format dan panjang untuk ${platform}
- Jangan ubah fakta atau informasi utama

Artikel:
${articleContent}`

    yield `---PLATFORM: ${platform}---\n`

    yield* streamCompletion(prompt)

    yield `\n---END: ${platform}---\n`
  }
}
