import { useMemo } from 'react'

function optimizeImageUrl(src, { width = 1200, quality = 78 } = {}) {
  if (typeof src !== 'string' || !src.trim()) {
    return ''
  }

  try {
    const url = new URL(src)

    if (url.hostname.includes('images.unsplash.com')) {
      url.searchParams.set('auto', 'format')
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('w', String(width))
      url.searchParams.set('q', String(quality))
      return url.toString()
    }

    return url.toString()
  } catch {
    return src
  }
}

export default function OptimizedImage({
  src,
  alt,
  className,
  widthHint = 1200,
  quality = 78,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto',
  sizes,
}) {
  const optimizedSrc = useMemo(() => optimizeImageUrl(src, { width: widthHint, quality }), [quality, src, widthHint])

  if (!optimizedSrc) {
    return null
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      sizes={sizes}
      referrerPolicy="no-referrer"
    />
  )
}
