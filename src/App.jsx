import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import './styles.css'

// Apple-accurate logical point dimensions, bezel/radius tuned to match real device chrome
const DEVICES = {
  mobile: [
    { id: 'iphone-15-pro', label: 'iPhone 15 Pro',  width: 393, height: 852, chrome: 'dynamic-island', bezel: 12, radius: 50 },
    { id: 'iphone-14',     label: 'iPhone 14',      width: 390, height: 844, chrome: 'notch',          bezel: 12, radius: 47 },
    { id: 'pixel-8',       label: 'Pixel 8',        width: 412, height: 915, chrome: 'hole-punch',     bezel: 14, radius: 36 },
    { id: 'galaxy-s24',    label: 'Galaxy S24',     width: 360, height: 780, chrome: 'hole-punch',     bezel: 12, radius: 30 },
  ],
  tablet: [
    { id: 'ipad-mini', label: 'iPad Mini',        width: 744,  height: 1133, chrome: 'ipad', bezel: 18, radius: 18 },
    { id: 'ipad-air',  label: 'iPad Air',         width: 820,  height: 1180, chrome: 'ipad', bezel: 18, radius: 18 },
    { id: 'ipad-pro',  label: 'iPad Pro 12.9"',   width: 1024, height: 1366, chrome: 'ipad', bezel: 20, radius: 20 },
  ],
  desktop: [
    { id: 'laptop',  label: 'Laptop · 1280',  width: 1280, height: 800,  chrome: 'window' },
    { id: 'desktop', label: 'Desktop · 1440', width: 1440, height: 900,  chrome: 'window' },
    { id: 'full-hd', label: 'Full HD · 1920', width: 1920, height: 1080, chrome: 'window' },
  ],
}

const CATEGORIES = [
  { id: 'mobile',  label: 'Mobile' },
  { id: 'tablet',  label: 'Tablet' },
  { id: 'desktop', label: 'Desktop' },
]

const WINDOW_BAR_H = 30
const LOAD_TIMEOUT_MS = 8000

function normalizeUrl(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isValidUrl(value) {
  if (!value) return false
  try {
    const u = new URL(value)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    return /\./.test(u.hostname)
  } catch {
    return false
  }
}

export default function App() {
  const [urlInput, setUrlInput] = useState('')
  const [loadedUrl, setLoadedUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [loadWarning, setLoadWarning] = useState('')
  const [category, setCategory] = useState('mobile')
  const [deviceId, setDeviceId] = useState('iphone-15-pro')
  const [rotated, setRotated] = useState(false)
  const [zoom, setZoom] = useState(0.85)
  const [autoFit, setAutoFit] = useState(true)
  const [iframeKey, setIframeKey] = useState(0)
  const [iframeLoading, setIframeLoading] = useState(false)
  const stageRef = useRef(null)

  const device = useMemo(() => {
    const list = DEVICES[category]
    return list.find(d => d.id === deviceId) ?? list[0]
  }, [category, deviceId])

  const isDesktop = category === 'desktop'

  // screen logical dimensions (rotate flips for mobile/tablet)
  const screen = useMemo(() => {
    if (!isDesktop && rotated) return { w: device.height, h: device.width }
    return { w: device.width, h: device.height }
  }, [device, rotated, isDesktop])

  // Frame natural dims = screen + bezel (mobile/tablet) or screen + top bar (desktop)
  const frame = useMemo(() => {
    if (isDesktop) {
      return {
        w: screen.w,
        h: screen.h + WINDOW_BAR_H,
        topOffset: WINDOW_BAR_H,
        sideOffset: 0,
      }
    }
    return {
      w: screen.w + device.bezel * 2,
      h: screen.h + device.bezel * 2,
      topOffset: device.bezel,
      sideOffset: device.bezel,
    }
  }, [screen, device, isDesktop])

  // Auto-fit: scale to fit stage
  useEffect(() => {
    if (!autoFit) return
    const el = stageRef.current
    if (!el) return
    const compute = () => {
      const padding = 64
      const availW = el.clientWidth - padding
      const availH = el.clientHeight - padding
      const scale = Math.min(availW / frame.w, availH / frame.h, 1)
      setZoom(Math.max(0.2, Math.min(1, scale)))
    }
    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [frame, autoFit])

  // iframe load timeout → blocked warning
  useEffect(() => {
    if (!iframeLoading) return
    const t = setTimeout(() => {
      setIframeLoading(false)
      setLoadWarning('This site may be blocking embedding (X-Frame-Options / CSP). Try opening it in a new tab.')
    }, LOAD_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [iframeLoading, iframeKey])

  const handleCategoryChange = (next) => {
    setCategory(next)
    setDeviceId(DEVICES[next][0].id)
    if (next === 'desktop') setRotated(false)
  }

  const handleLoad = useCallback(() => {
    const normalized = normalizeUrl(urlInput)
    if (!isValidUrl(normalized)) {
      setUrlError('Enter a valid URL — e.g. apple.com')
      return
    }
    setUrlError('')
    setLoadWarning('')
    setLoadedUrl(normalized)
    setUrlInput(normalized)
    setIframeLoading(true)
    setIframeKey(k => k + 1)
  }, [urlInput])

  const handleReload = useCallback(() => {
    if (!loadedUrl) return
    setLoadWarning('')
    setIframeLoading(true)
    setIframeKey(k => k + 1)
  }, [loadedUrl])

  const handleOpenExternal = useCallback(() => {
    if (!loadedUrl) return
    window.open(loadedUrl, '_blank', 'noopener,noreferrer')
  }, [loadedUrl])

  const handleClear = () => {
    setUrlInput('')
    setLoadedUrl('')
    setUrlError('')
    setLoadWarning('')
  }

  const handleZoomChange = (e) => {
    setAutoFit(false)
    setZoom(Number(e.target.value))
  }

  const handleIframeLoad = () => {
    setIframeLoading(false)
    setLoadWarning('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLoad()
  }

  const shellW = frame.w * zoom
  const shellH = frame.h * zoom

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <h1 className="header-title">Device Preview</h1>
            <p className="header-sub">See any website across phone, tablet, and desktop — instantly</p>
          </div>
          <div className="header-right">
            <button
              className="icon-btn header-icon-btn"
              onClick={handleOpenExternal}
              disabled={!loadedUrl}
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <IconExternal />
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* URL bar */}
        <section className="url-bar">
          <div className={`url-field${urlError ? ' has-error' : ''}`}>
            <IconLink />
            <input
              type="text"
              className="url-input"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); if (urlError) setUrlError('') }}
              onKeyDown={handleKeyDown}
              placeholder="Paste a URL — e.g. apple.com"
              spellCheck={false}
              autoComplete="off"
              aria-label="Website URL"
            />
            {urlInput && (
              <button className="url-clear" onClick={handleClear} aria-label="Clear URL">
                <IconX />
              </button>
            )}
          </div>
          <button
            className="btn-primary"
            onClick={handleLoad}
            disabled={!urlInput.trim()}
            aria-label="Load website"
          >
            Load
          </button>
        </section>

        {urlError && (
          <p className="inline-error" role="alert">
            <IconInfo /> {urlError}
          </p>
        )}

        {/* Controls */}
        <section className="controls">
          <div className="segment" role="tablist" aria-label="Device category">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={category === cat.id}
                className={`segment-btn${category === cat.id ? ' is-active' : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                <CategoryIcon id={cat.id} />
                {cat.label}
              </button>
            ))}
          </div>

          <div className="control-divider" />

          <select
            className="device-select"
            value={deviceId}
            onChange={e => setDeviceId(e.target.value)}
            aria-label="Pick a device"
          >
            {DEVICES[category].map(d => (
              <option key={d.id} value={d.id}>
                {d.label} — {d.width}×{d.height}
              </option>
            ))}
          </select>

          {!isDesktop && (
            <button
              className={`icon-btn${rotated ? ' is-active' : ''}`}
              onClick={() => setRotated(v => !v)}
              aria-label={rotated ? 'Set portrait' : 'Set landscape'}
              title={rotated ? 'Portrait' : 'Landscape'}
            >
              <IconRotate />
            </button>
          )}

          <button
            className="icon-btn"
            onClick={handleReload}
            disabled={!loadedUrl}
            aria-label="Reload preview"
            title="Reload"
          >
            <IconReload />
          </button>

          <div className="zoom-control">
            <span className="zoom-label">Zoom</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={zoom}
              onChange={handleZoomChange}
              className="zoom-slider"
              aria-label="Zoom level"
            />
            <span className="zoom-value">{Math.round(zoom * 100)}%</span>
            <button
              className={`btn-pill-mini${autoFit ? ' is-active' : ''}`}
              onClick={() => setAutoFit(v => !v)}
              aria-pressed={autoFit}
              title="Auto-fit to stage"
            >
              Fit
            </button>
          </div>
        </section>

        {/* Stage */}
        <section className="stage" ref={stageRef}>
          {!loadedUrl ? (
            <EmptyState />
          ) : (
            <div className="device-shell">
              <div
                className={`device-outer chrome-${device.chrome}`}
                style={{ width: shellW, height: shellH }}
              >
                <div
                  className="device-inner"
                  style={{
                    width: frame.w,
                    height: frame.h,
                    transform: `scale(${zoom})`,
                    transformOrigin: '0 0',
                    borderRadius: isDesktop ? 14 : device.radius + device.bezel,
                  }}
                >
                  {device.chrome === 'window' && (
                    <div className="window-bar" style={{ height: WINDOW_BAR_H }}>
                      <span className="dot dot-r" />
                      <span className="dot dot-y" />
                      <span className="dot dot-g" />
                      <span className="window-url">{loadedUrl}</span>
                    </div>
                  )}

                  {device.chrome === 'ipad' && (
                    <span
                      className="ipad-cam"
                      style={{
                        top: rotated ? '50%' : device.bezel / 2,
                        left: rotated ? device.bezel / 2 : '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  )}

                  <div
                    className="screen"
                    style={{
                      top: frame.topOffset,
                      left: frame.sideOffset,
                      width: screen.w,
                      height: screen.h,
                    }}
                  >
                    <iframe
                      key={iframeKey}
                      src={loadedUrl}
                      title="Device preview"
                      className="preview-iframe"
                      style={{ borderRadius: isDesktop ? 0 : device.radius }}
                      onLoad={handleIframeLoad}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      referrerPolicy="no-referrer-when-downgrade"
                    />

                    {device.chrome === 'dynamic-island' && !rotated && <span className="dynamic-island" />}
                    {device.chrome === 'notch' && !rotated && <span className="notch" />}
                    {device.chrome === 'hole-punch' && !rotated && <span className="hole-punch" />}

                    {iframeLoading && (
                      <div className="iframe-loading">
                        <span className="spinner" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="device-meta">
                {device.label} · {screen.w}×{screen.h}
              </div>
            </div>
          )}
        </section>

        {loadWarning && (
          <p className="footnote">
            <IconInfo /> {loadWarning}
          </p>
        )}
      </main>

      <footer className="credit">
        Coded by{' '}
        <a href="https://instagram.com/berkindev" target="_blank" rel="noopener noreferrer" className="credit-link">
          berkindev
        </a>
      </footer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-glow" />
      <div className="empty-icon">
        <IconDevices />
      </div>
      <h2 className="empty-title">Paste a URL to preview</h2>
      <p className="empty-sub">
        Test responsive layouts across phone, tablet, and desktop — no DevTools, no resizing.
      </p>
      <div className="empty-hints">
        <span className="hint-chip"><IconKbd /> Enter to load</span>
        <span className="hint-chip"><IconRotate /> Rotate phone & tablet</span>
        <span className="hint-chip"><IconZoom /> Zoom or auto-fit</span>
      </div>
    </div>
  )
}

function CategoryIcon({ id }) {
  if (id === 'mobile') {
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="5" y="2" width="6" height="12" rx="1.5"/>
        <line x1="7.5" y1="12" x2="8.5" y2="12"/>
      </svg>
    )
  }
  if (id === 'tablet') {
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="2.5" width="10" height="11" rx="1.5"/>
        <circle cx="8" cy="12" r="0.5" fill="currentColor"/>
      </svg>
    )
  }
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1.5" y="3" width="13" height="8.5" rx="1"/>
      <path d="M5 13.5h6M8 11.5v2"/>
    </svg>
  )
}

function IconLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6.5 9.5L9.5 6.5"/>
      <path d="M9 4l1.5-1.5a3 3 0 014.2 4.2L13 8.5"/>
      <path d="M7 11.5L5.5 13a3 3 0 01-4.2-4.2L3 7"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 3l8 8M11 3l-8 8"/>
    </svg>
  )
}

function IconRotate() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8a5.5 5.5 0 019.4-3.9l1.6 1.6"/>
      <path d="M13.5 8a5.5 5.5 0 01-9.4 3.9L2.5 10.3"/>
      <path d="M13.5 2.5v3.2h-3.2"/>
      <path d="M2.5 13.5v-3.2h3.2"/>
    </svg>
  )
}

function IconReload() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 3.5v3.2h-3.2"/>
      <path d="M13 6.7A5.5 5.5 0 002.7 9"/>
      <path d="M2.5 12.5v-3.2h3.2"/>
      <path d="M3 9.3A5.5 5.5 0 0013.3 7"/>
    </svg>
  )
}

function IconExternal() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3H3v8h8V8"/>
      <path d="M9 2h3v3M12 2L7 7"/>
    </svg>
  )
}

function IconInfo() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6"/>
      <line x1="8" y1="7.5" x2="8" y2="11"/>
      <circle cx="8" cy="5.2" r="0.6" fill="currentColor"/>
    </svg>
  )
}

function IconKbd() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 6.5a2 2 0 012-2h6.5l3 3v2a2 2 0 01-2 2H8"/>
      <path d="M2 10.5l3 3 3-3M5 13V8"/>
    </svg>
  )
}

function IconZoom() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5"/>
      <path d="M10.5 10.5l3 3"/>
      <path d="M5 7h4M7 5v4"/>
    </svg>
  )
}

function IconDevices() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="10" width="24" height="16" rx="1.5"/>
      <path d="M14 30h8M18 26v4"/>
      <rect x="28" y="18" width="14" height="20" rx="2"/>
      <line x1="34" y1="35" x2="36" y2="35"/>
    </svg>
  )
}
