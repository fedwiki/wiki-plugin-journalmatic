import { DROP_MESSAGE_KIND, serializeDataTransfer } from './modules/drop-payload.mjs'

// Overlay relay avoids Chromium/Safari iframe drop bug (see crbug.com/40822630, 41443847)

function detectBrowser () {
  const ua = navigator.userAgent
  if (/firefox|fxios/i.test(ua)) return 'firefox'
  if (/edg/i.test(ua)) return 'chrome'
  if (/chrome|chromium|crios/i.test(ua)) return 'chrome'
  if (/safari/i.test(ua)) return 'safari'
  return 'other'
}

function shouldEnableRelay (pageAttr) {
  const value = (pageAttr || 'auto').toLowerCase()
  if (value === 'off') return false
  if (value === 'on') return true

  const browser = detectBrowser()
  if (value && value !== 'auto') {
    const tokens = value.split(/[\s,]+/).filter(Boolean)
    if (tokens.length > 0) {
      return tokens.includes(browser)
    }
  }

  return browser !== 'firefox'
}

function getPageElement (scriptEl) {
  if (!scriptEl?.closest) return null
  return scriptEl.closest('.page') || document.body
}

function primeDataTransfer (event) {
  try {
    if (!event.dataTransfer) return
    if (event.dataTransfer.types && event.dataTransfer.types.length > 0) return
    const label = (event.target?.dataset?.label || event.target?.textContent || '').trim()
    if (!label) return
    event.dataTransfer.setData('text/plain', label)
  } catch (error) {
    // browsers may block setData outside trusted gestures; ignore
  }
}

function syncOverlayPosition (overlayEl, iframe) {
  if (!overlayEl || !iframe) return
  const rect = iframe.getBoundingClientRect()
  Object.assign(overlayEl.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  })
}

function createOverlay ({ iframe, zIndex, cursor, pageEl, onDrop }) {
  const overlay = document.createElement('div')
  overlay.dataset.jmDndOverlay = 'true'
  overlay.setAttribute('aria-hidden', 'true')
  overlay.style.position = 'fixed'
  overlay.style.pointerEvents = 'auto'
  overlay.style.background = 'transparent'
  overlay.style.zIndex = String(zIndex || 2147483647)
  overlay.style.cursor = cursor || 'copy'
  overlay.style.touchAction = 'none'
  overlay.style.border = 'none'

  const targetOrigin = (() => {
    try {
      return new URL(iframe.src, window.location.href).origin
    } catch (error) {
      return '*'
    }
  })()

  function relayDrop (event) {
    const payload = serializeDataTransfer(event.dataTransfer)
    payload.modifiers = {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey
    }
    iframe.contentWindow?.postMessage({
      kind: DROP_MESSAGE_KIND,
      payload
    }, targetOrigin)
  }

  overlay.addEventListener('dragover', event => {
    event.preventDefault()
  })
  overlay.addEventListener('dragenter', event => {
    event.preventDefault()
  })
  overlay.addEventListener('drop', event => {
    event.preventDefault()
    relayDrop(event)
    onDrop?.()
  })

  syncOverlayPosition(overlay, iframe)
  document.body.appendChild(overlay)
  pageEl.dataset.jmDndOverlayActive = 'true'

  return overlay
}

function setupRelay (scriptEl) {
  const pageEl = getPageElement(scriptEl)
  if (!pageEl || pageEl.dataset.jmDndRelayReady === 'true') {
    return
  }

  const attr = pageEl.getAttribute('data-jm-dnd-relay') || scriptEl.dataset.jmDndRelay || 'auto'
  pageEl.setAttribute('data-jm-dnd-relay', attr)
  const enabled = shouldEnableRelay(attr)
  pageEl.dataset.jmDndRelayState = enabled ? 'enabled' : 'disabled'
  if (!enabled) return

  const iframeSelector = scriptEl.dataset.jmDndRelayTarget || 'iframe[src*="journalmatic/"]'
  const pageState = {
    overlay: null
  }

  function ensureIframe () {
    const iframe = pageEl.querySelector(iframeSelector)
    return iframe
  }

  function removeOverlay () {
    if (!pageState.overlay) return
    pageState.overlay.remove()
    pageState.overlay = null
    pageEl.dataset.jmDndOverlayActive = 'false'
  }

  function attachOverlayIfNeeded () {
    if (pageState.overlay) return
    const iframe = ensureIframe()
    if (!iframe || !iframe.contentWindow) return
    pageState.overlay = createOverlay({
      iframe,
      zIndex: scriptEl.dataset.jmDndRelayZ,
      cursor: scriptEl.dataset.jmDndRelayCursor,
      pageEl,
      onDrop: removeOverlay
    })
  }

  function refreshOverlay () {
    if (!pageState.overlay) return
    const iframe = ensureIframe()
    if (!iframe) {
      removeOverlay()
      return
    }
    syncOverlayPosition(pageState.overlay, iframe)
  }

  document.addEventListener('dragstart', event => {
    primeDataTransfer(event)
    attachOverlayIfNeeded()
  })

  document.addEventListener('dragend', removeOverlay, true)
  document.addEventListener('drop', removeOverlay, true)
  window.addEventListener('blur', removeOverlay)
  window.addEventListener('scroll', refreshOverlay, true)
  window.addEventListener('resize', refreshOverlay, true)

  if (!ensureIframe()) {
    const observer = new MutationObserver(() => {
      if (ensureIframe()) {
        observer.disconnect()
      }
    })
    observer.observe(pageEl, { childList: true, subtree: true })
  }

  pageEl.dataset.jmDndRelayReady = 'true'
}

export function bootstrapRelay (options = {}) {
  const scriptEl = options.scriptEl || document.currentScript
  if (!scriptEl) return
  setupRelay(scriptEl)
}

export default bootstrapRelay
