const DROP_MESSAGE_KIND = 'jm/drop'
const FLAG_PATTERN = /^(https?:)\/\/([a-zA-Z0-9:.-]+)(\/([a-zA-Z0-9:.-]+)\/([a-z0-9-]+(_rev\d+)?))+$/i
const URI_FLAVORS = ['text/uri-list', 'text/x-moz-url', 'text/x-moz-url-data', 'text/x-moz-urlz', 'URL']

function uniqueTypes (types) {
  return Array.from(new Set(Array.from(types || [])))
}

function cleanUriCandidate (value) {
  if (!value) return null
  const firstLine = value.split('\n').find(Boolean)
  return firstLine ? firstLine.trim() : null
}

function extractFromHtml (html) {
  if (!html) return null
  const hrefMatch = html.match(/href=["']([^"']+)["']/i)
  return hrefMatch ? hrefMatch[1] : null
}

function normalizePayload (input = {}) {
  return {
    types: uniqueTypes(input.types),
    text: input.text ?? null,
    html: input.html ?? null,
    uri: input.uri ?? null
  }
}

export function serializeDataTransfer (dt) {
  if (!dt) {
    return normalizePayload({})
  }

  const types = uniqueTypes(dt.types)
  let uri = null
  for (const flavor of URI_FLAVORS) {
    if (types.includes(flavor)) {
      try {
        uri = dt.getData(flavor)
      } catch (error) {
        uri = null
      }
      if (uri) break
    }
  }

  let text = null
  try {
    text = dt.getData('text/plain')
  } catch (error) {
    text = null
  }

  let html = null
  try {
    html = dt.getData('text/html')
  } catch (error) {
    html = null
  }

  return normalizePayload({ types, text, html, uri })
}

export function extractRawUrl (payload = {}) {
  const { types = [], uri, text, html } = normalizePayload(payload)

  if (types.some(type => URI_FLAVORS.includes(type))) {
    const candidate = cleanUriCandidate(uri)
    if (candidate) return candidate
  }

  if (text && text.trim().startsWith('http')) {
    return text.trim()
  }

  const fromHtml = extractFromHtml(html)
  if (fromHtml) return fromHtml

  return cleanUriCandidate(uri) || null
}

export function parseWikiFlagUrl (rawUrl) {
  if (!rawUrl) return null

  const match = rawUrl.match(FLAG_PATTERN)
  if (!match) return null

  const protocol = match[1]
  const origin = match[2]
  let site = match[4]
  const slug = match[5]

  if (['view', 'local', 'origin'].includes(site)) {
    site = origin
  }

  const pageURL = `${protocol}//${site}/${slug}.json`

  return {
    protocol,
    origin,
    site,
    slug,
    pageURL,
    rawUrl
  }
}

export function parseWikiFlagPayload (payload) {
  const rawUrl = extractRawUrl(payload)
  if (!rawUrl) return null
  return parseWikiFlagUrl(rawUrl)
}

export { DROP_MESSAGE_KIND }
