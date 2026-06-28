# The Build Log · Part 1 — Device Preview

*The Build Log* serisinin ilk projesi. **30 Web Apps** serisi (Day 1–30) tamamlandı; bu yeni seri devamı — daha pratik, daha gündelik kullanışlı, slide formatına uygun küçük araçlar.

---

## Konsept

Slide notlarındaki problem: bir siteyi farklı cihazlarda test etmek için ya DevTools açıp resize ediyorsun ya da gerçek cihaza yüklüyorsun. Çözüm: **URL yapıştır, segmente göre cihaz seç, anında preview.**

Slide 2 (Learn. Build. Ship.) — Coddy üzerinden responsive web design öğrendim → bu aracı kurdum.
Slide 3 (Test Before You Launch) — DevTools yok, resize yok, sadece paste.
Slide 4 (CTA) — "Comment DEVICE and I will send you the link."

---

## Tasarım Dili (önceki seriyle birebir)

`timestamp-converter` ve `nickname-generator` ile aynı sistemi koruduk — yeni seri görsel olarak akıcı bir devam.

- Dark-first zemin `#0a0a0c` + üstte hafif radial gradient
- Tek aksan: indigo `#6366f1` — primary CTA, focus, badge
- Surface katmanları (`--surface`, `--surface-2`, `--surface-3`) — derinlik hissi için
- Köşeler: 20 (kartlar) / 14 (input/segment) / pill (CTA, segment butonu)
- Stage'de subtle grid pattern + indigo glow → cihaz havada duruyor hissi
- Tipografi: Inter (sans), SF Mono (cihaz boyutu / URL)
- Micro-interactions 180ms — segment hover'da color shift, primary CTA hover'da translateY + glow
- Cihaz frame'leri: mobile için notch, tablet için kamera noktası, desktop için traffic lights — Apple-style
- Pure CSS + CSS custom properties — Tailwind YOK, TypeScript YOK

---

## Stack

| Katman | Seçim | Neden |
|---|---|---|
| Framework | React 19 + Vite 5 | Seri standardı |
| Styling | Pure CSS + design tokens | Önceki projelerle aynı |
| State | `useState` + `useMemo` + `useCallback` + `useRef` + `useEffect` | Tek dosyada manage edilebilir |
| Layout fit | `ResizeObserver` | Stage değişince auto-fit |
| Font | Inter (400/500/600/700) | Seri stack'i |
| Bağımlılık sayısı | Sıfır (React/ReactDOM dışında) | Lean |

---

## Özellikler

1. **URL bar** — paste + Enter veya Load butonu, otomatik `https://` prepend, validation
2. **3 kategori × 3–4 cihaz = 10 preset** — iPhone 15 Pro, iPhone SE, Pixel 7, Galaxy S23, iPad Mini, iPad, iPad Pro 12.9", Laptop 1280, Desktop 1440, Full HD 1920
3. **Rotate** — phone/tablet için portrait ↔ landscape (desktop'ta disabled)
4. **Auto-fit** — `ResizeObserver` ile stage boyutuna göre zoom otomatik hesaplanır
5. **Manual zoom** — 20–100% slider, slider hareketi auto-fit'i kapatır
6. **Device chrome** — mobile notch, tablet kamera dot, desktop window bar (traffic lights + URL)
7. **Reload** — `iframeKey` increment ile iframe rerender
8. **Open in new tab** — bazı siteler embed'i bloklayınca alternatif
9. **X-Frame-Options uyarı** — load sonrası küçük footnote
10. **Sandbox** — iframe `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`

---

## Mimari Notlar

### Dosya yapısı
```
device-preview/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── PROJECT_NOTES.md  ← bu dosya
└── src/
    ├── main.jsx       (React mount)
    ├── App.jsx        (tüm UI + device katalog + ResizeObserver auto-fit)
    └── styles.css     (design tokens + device frame stilleri)
```

### State şeması
```js
{
  urlInput: '',          // input'taki ham metin
  loadedUrl: '',         // iframe'e gönderilen normalize URL
  category: 'mobile',    // 'mobile' | 'tablet' | 'desktop'
  deviceId: 'iphone-15-pro',
  rotated: false,        // portrait ↔ landscape
  zoom: 0.85,            // 0.2 - 1.0
  autoFit: true,         // ResizeObserver kontrolü
  iframeKey: 0,          // reload için key bump
  iframeLoading: false,  // spinner gösterimi
}
```

### Auto-fit algoritması
- `stageRef.current.clientWidth/Height` - 80px padding
- `scale = min(availW / dims.width, availH / dims.height, 1)`
- `ResizeObserver` ile her resize'da yeniden hesap
- Manual zoom slider'a dokunulduğunda `autoFit=false` → kullanıcı kontrolü

### Cihaz scale yaklaşımı
Iframe gerçek device pixel ölçülerinde render edilir (örn. 393×852), sonra `transform: scale(zoom)` ile küçültülür. Container width/height de `dims × zoom` ile hesaplanır → DOM layout doğru, içerik orijinal viewport mantığında.

### Erişilebilirlik
- Tüm interaktif elementlerde `aria-label` / `aria-pressed` / `aria-selected`
- Segment için `role="tablist"` + `role="tab"`
- `:focus-visible` ile belirgin indigo focus ring
- Enter ile URL load
- iframe `title` set

---

## Yapı / Bileşenler

- **Header** — Build Log badge + title/sub + "Open" external link butonu
- **URL bar** — icon-prefixed input + clear button + primary "Load"
- **Controls bar** — segment (kategori) + device dropdown + rotate icon + reload icon + zoom slider + Fit toggle
- **Stage** — grid-pattern background + glow + cihaz frame'i
- **Device shell** — frame (notch/camera/window bar) + scaled iframe + meta label
- **Empty state** — büyük cihaz ikonu + 3 hint chip
- **Footnote** — X-Frame-Options uyarısı (sadece URL yüklüyse)
- **Credit footer**

---

## Tamamlandı / Test

- `npm install` — temiz (61 paket, 5s)
- `npm run build` — temiz (349ms, 13.01kB CSS gzip 3.22kB, 203.60kB JS gzip 63.57kB)
- `npm run dev` — `localhost:5174` 200 OK (5173 dolu olduğu için fallback)
- Responsive: 900 / 720 / 600 breakpoint'leri test edildi
- Klavye ile tam navigasyon mümkün

---

## Sonraki Adımlar (opsiyonel)

- Multi-device view — 3 cihaz yan yana scroll edilebilir
- URL geçmişi (localStorage)
- Screenshot capture (canvas → png download)
- User agent spoofing (gerçek mobile UA için server-side proxy lazım)
- Custom device boyutu girişi
