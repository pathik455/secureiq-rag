import OpenAI from 'openai'

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-your-')) {
    return null
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// Deterministic fallback pseudo-embedding for testing or when API key isn't provided
function generateMockEmbedding(text: string, dimensions = 1536): number[] {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  const vec: number[] = new Array(dimensions)
  for (let i = 0; i < dimensions; i++) {
    const val = Math.sin(hash + i) * 0.5
    vec[i] = Number(val.toFixed(6))
  }
  return vec
}

export async function createEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient()
  if (!openai) {
    return generateMockEmbedding(text)
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n+/g, ' ').slice(0, 8000),
    })
    return response.data[0].embedding
  } catch (error) {
    console.warn('OpenAI embedding error, using mock fallback vector:', error)
    return generateMockEmbedding(text)
  }
}

export async function createBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAIClient()
  if (!openai) {
    return texts.map((t) => generateMockEmbedding(t))
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts.map((t) => t.replace(/\n+/g, ' ').slice(0, 8000)),
    })
    return response.data.map((d) => d.embedding)
  } catch (error) {
    console.warn('OpenAI batch embedding error, falling back:', error)
    return texts.map((t) => generateMockEmbedding(t))
  }
}
