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

  // Clean the URL by removing query parameters (e.g., ?utm_source)
  const urlObj = new URL(url)
  urlObj.search = ''
  const cleanUrl = urlObj.toString()

  const endpoint = `https://graph.facebook.com/instagram_oembed?url=${encodeURIComponent(cleanUrl)}`
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

// Detect whether an Instagram URL is a post, account profile, or invalid
export function detectInstagramUrlType(url: string): 'post' | 'account' | 'invalid' {
  let cleanUrl = url
  try {
    const urlObj = new URL(url)
    urlObj.search = ''
    urlObj.hash = ''
    cleanUrl = urlObj.toString()
  } catch (e) {
    // Ignore invalid URL errors here, regex will fail anyway
  }

  if (/instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/.test(cleanUrl)) return 'post'
  if (/instagram\.com\/([A-Za-z0-9_.]+)\/?$/.test(cleanUrl)) return 'account'
  return 'invalid'
}

// For account URLs, extract the username
export function extractInstagramUsername(url: string): string | null {
  let cleanUrl = url
  try {
    const urlObj = new URL(url)
    urlObj.search = ''
    urlObj.hash = ''
    cleanUrl = urlObj.toString()
  } catch (e) {
    // Ignore invalid URL parsing errors
  }

  const match = cleanUrl.match(/instagram\.com\/([A-Za-z0-9_.]+)\/?$/)
  return match ? match[1] : null
}

