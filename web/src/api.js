export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export const IS_NATIVE = import.meta.env.VITE_NATIVE === '1' || !!window.Capacitor?.isNativePlatform?.()

const TOKEN_KEY = 'gd_token'

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(t) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ }
}

export const media = (url) => (url && url.startsWith('/uploads') ? API_URL + url : url)

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let res
  try {
    res = await fetch(`${API_URL}/api${path}`, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) })
  } catch {
    throw new Error('Нет связи с сервером')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Ошибка сервера')
    err.status = res.status
    throw err
  }
  return data
}

export function money(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1).replace('.0', '').replace('.', ',')} млрд`
  if (n >= 1e6) return `$${Math.round(n / 1e6)} млн`
  if (n >= 1e3) return `$${Math.round(n / 1e3)} тыс`
  return `$${n}`
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'только что'
  if (s < 3600) return `${Math.floor(s / 60)} мин`
  if (s < 86400) return `${Math.floor(s / 3600)} ч`
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export const clock = (ts) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
