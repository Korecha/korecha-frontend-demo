const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export function fileUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}
