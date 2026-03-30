export interface InstagramMetadata {
  caption: string
  hashtags: string[]
  mediaType: string
  thumbnailUrl: string | null
  timestamp: string | null
}

const INSTAGRAM_REGEX = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/i

export function validateInstagramUrl(url: string) {
  if (!INSTAGRAM_REGEX.test(url)) {
    throw new Error('Invalid Instagram URL. Please use a public post link.')
  }
}

export async function fetchInstagramMetadata(url: string): Promise<InstagramMetadata> {
  validateInstagramUrl(url)

  const endpoint = `https://graph.facebook.com/instagram_oembed?url=${encodeURIComponent(url)}`
  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error('Unable to fetch Instagram metadata. Ensure the post is public.')
  }

  const data = (await response.json()) as {
    title?: string
    author_name?: string
    media_type?: string
    thumbnail_url?: string
    timestamp?: string
  }

  const caption = data.title || 'Instagram post'
  const hashtags = Array.from(new Set(caption.match(/#[A-Za-z0-9_]+/g) ?? [])).map((tag) => tag.toLowerCase())

  return {
    caption,
    hashtags,
    mediaType: data.media_type || 'unknown',
    thumbnailUrl: data.thumbnail_url ?? null,
    timestamp: data.timestamp ?? null,
  }
}
