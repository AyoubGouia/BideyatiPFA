const HTTP_PROTOCOL_REGEX = /^https?:\/\//i

export function normalizeExternalUrl(url: string): string {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return ''
  }

  if (HTTP_PROTOCOL_REGEX.test(trimmedUrl)) {
    return trimmedUrl
  }

  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`
  }

  return `https://${trimmedUrl}`
}
