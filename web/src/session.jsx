import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { api, API_URL, getToken, setToken } from './api.js'

const SessionCtx = createContext(null)
export const useSession = () => useContext(SessionCtx)

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [matches, setMatches] = useState([])
  const [notifications, setNotifications] = useState([])
  const [matchEvent, setMatchEvent] = useState(null)
  const [toast, setToast] = useState(null)
  const [typing, setTyping] = useState({})
  const socketRef = useRef(null)
  const listeners = useRef(new Set())
  const activeChat = useRef(null)
  const shownMatches = useRef(new Set())

  const showMatch = useCallback((m) => {
    if (!m) return setMatchEvent(null)
    if (shownMatches.current.has(m.id)) return
    shownMatches.current.add(m.id)
    setMatchEvent(m)
  }, [])

  const loadAll = useCallback(async () => {
    const [m, n] = await Promise.all([api('/matches'), api('/notifications')])
    setMatches(m)
    setNotifications(n)
  }, [])

  useEffect(() => {
    if (!getToken()) { setReady(true); return }
    api('/me')
      .then((u) => setUser(u))
      .catch((e) => { if (e.status === 401) setToken(null) })
      .finally(() => setReady(true))
  }, [])

  // realtime only for finished profiles
  useEffect(() => {
    if (!user?.onboarded) return
    loadAll().catch(() => {})
    const socket = io(API_URL || undefined, { auth: { token: getToken() }, transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('message', (msg) => {
      listeners.current.forEach((fn) => fn(msg))
      setTyping((t) => ({ ...t, [msg.matchId]: false }))
      setMatches((list) => {
        const idx = list.findIndex((m) => m.id === msg.matchId)
        if (idx === -1) { loadAll().catch(() => {}); return list }
        const mine = msg.senderId === user.id
        const viewing = activeChat.current === msg.matchId
        const updated = { ...list[idx], lastMessage: msg, unread: mine || viewing ? list[idx].unread : list[idx].unread + 1 }
        return [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
      })
    })
    socket.on('match', (m) => {
      setMatches((list) => (list.some((x) => x.id === m.id) ? list : [m, ...list]))
      showMatch(m)
    })
    socket.on('unmatch', ({ matchId }) => setMatches((list) => list.filter((m) => m.id !== matchId)))
    socket.on('read', ({ matchId }) => {
      listeners.current.forEach((fn) => fn({ type: 'read', matchId }))
    })
    socket.on('typing', ({ matchId }) => {
      setTyping((t) => ({ ...t, [matchId]: Date.now() }))
      setTimeout(() => setTyping((t) => (t[matchId] && Date.now() - t[matchId] >= 3900 ? { ...t, [matchId]: false } : t)), 4000)
    })
    socket.on('notification', (n) => {
      if (n.type === 'message' && activeChat.current === n.refId) {
        api('/matches/' + n.refId + '/read', { method: 'POST' }).catch(() => {})
        n = { ...n, read: true }
      } else if (n.type !== 'match') {
        setToast({ ...n, key: n.id })
      }
      setNotifications((list) => [n, ...list].slice(0, 50))
    })
    return () => { socket.disconnect(); socketRef.current = null }
  }, [user?.onboarded, user?.id, loadAll, showMatch])

  const value = useMemo(() => ({
    user, ready, matches, notifications, matchEvent, toast, typing,
    setUser,
    setMatches,
    setToast,
    showMatch,
    async auth(mode, login, password) {
      const res = await api(`/auth/${mode}`, { method: 'POST', body: { login, password } })
      setToken(res.token)
      setUser(res.user)
      return res.user
    },
    logout() {
      setToken(null)
      setUser(null)
      setMatches([])
      setNotifications([])
    },
    onMessage(fn) {
      listeners.current.add(fn)
      return () => listeners.current.delete(fn)
    },
    setActiveChat(id) { activeChat.current = id },
    sendTyping(matchId) { socketRef.current?.emit('typing', { matchId }) },
    async markChatRead(matchId) {
      setMatches((list) => list.map((m) => (m.id === matchId ? { ...m, unread: 0 } : m)))
      setNotifications((list) => list.map((n) => (n.type === 'message' && n.refId === matchId ? { ...n, read: true } : n)))
      await api(`/matches/${matchId}/read`, { method: 'POST' }).catch(() => {})
    },
    async markNotificationsRead() {
      setNotifications((list) => list.map((n) => ({ ...n, read: true })))
      await api('/notifications/read', { method: 'POST' }).catch(() => {})
    },
  }), [user, ready, matches, notifications, matchEvent, toast, typing, showMatch])

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}
