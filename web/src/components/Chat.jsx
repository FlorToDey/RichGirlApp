import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, CheckCheck, Info, SendHorizontal, UserX } from 'lucide-react'
import { useSession } from '../session.jsx'
import { api, clock, money } from '../api.js'
import { useDesktop, useMedia } from '../hooks.js'
import Avatar from './Avatar.jsx'
import ProfileSheet, { ProfileBody } from './ProfileSheet.jsx'

const ICEBREAKERS = {
  f: ['Привет! Какая у тебя яхта? 😏', 'Ты правда сама всё заработала?', 'Я умею готовить. И молчать. Интересно?'],
  m: ['Привет! Ты всегда так красиво молчишь?', 'Умеешь носить сумки? Проверим в субботу', 'Привет 💅 Летим в Ниццу?'],
}

export default function Chat() {
  const { id } = useParams()
  const matchId = Number(id)
  const { matches, user, onMessage, setActiveChat, markChatRead, typing, sendTyping, setMatches } = useSession()
  const navigate = useNavigate()
  const desktop = useDesktop()
  const wide = useMedia('(min-width: 1280px)')
  const match = matches.find((m) => m.id === matchId)
  const [messages, setMessages] = useState(null)
  const [text, setText] = useState('')
  const [info, setInfo] = useState(false)
  const [menu, setMenu] = useState(false)
  const listRef = useRef(null)
  const lastTyping = useRef(0)

  useEffect(() => {
    setMessages(null)
    setActiveChat(matchId)
    api(`/matches/${matchId}/messages`).then(setMessages).catch(() => navigate('/app/chats', { replace: true }))
    markChatRead(matchId)
    const off = onMessage((msg) => {
      if (msg.type === 'read') {
        if (msg.matchId === matchId) setMessages((list) => list && list.map((m) => (m.senderId === user.id ? { ...m, read: true } : m)))
        return
      }
      if (msg.matchId !== matchId) return
      setMessages((list) => (list && !list.some((m) => m.id === msg.id) ? [...list, msg] : list))
      if (msg.senderId !== user.id) markChatRead(matchId)
    })
    return () => { off(); setActiveChat(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  useLayoutEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: messages?.length > 1 ? 'smooth' : 'auto' })
  }, [messages, typing[matchId]])

  async function send(value = text) {
    const t = value.trim()
    if (!t) return
    setText('')
    try {
      const msg = await api(`/matches/${matchId}/messages`, { method: 'POST', body: { text: t } })
      setMessages((list) => (list.some((m) => m.id === msg.id) ? list : [...list, msg]))
    } catch {
      setText(t)
    }
  }

  async function unmatch() {
    await api(`/matches/${matchId}`, { method: 'DELETE' }).catch(() => {})
    setMatches((list) => list.filter((m) => m.id !== matchId))
    navigate('/app/chats', { replace: true })
  }

  if (!match) {
    return <div className="chat-empty"><span className="spinner" /></div>
  }
  const other = match.user

  const chat = (
    <div className="chat">
      <div className="chat-head">
        {!desktop && <motion.button className="icon-btn" whileTap={{ scale: 0.85 }} onClick={() => navigate('/app/chats')} aria-label="Назад"><ArrowLeft size={22} /></motion.button>}
        <button className="chat-who" onClick={() => setInfo(true)}>
          <Avatar user={other} size={42} online={other.online} />
          <div>
            <strong>{other.name}</strong>
            <span>{typing[matchId] ? <em className="typing-text">печатает…</em> : other.role === 'f' ? `Состояние ${money(other.netWorth)}` : other.online ? 'онлайн' : 'был(а) недавно'}</span>
          </div>
        </button>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <motion.button className="icon-btn" whileTap={{ scale: 0.85 }} onClick={() => setMenu((m) => !m)} aria-label="Меню"><Info size={20} /></motion.button>
          <AnimatePresence>
            {menu && (
              <motion.div className="filter-pop chat-menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <button className="filter-item" onClick={() => { setMenu(false); setInfo(true) }}>Анкета</button>
                <button className="filter-item danger" onClick={unmatch}><UserX size={16} /> Удалить мэтч</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="chat-body scroll" ref={listRef}>
        <motion.div className="chat-intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Avatar user={other} size={84} ring />
          <p>Мэтч с <strong>{other.name}</strong> · {new Date(match.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
        </motion.div>
        {messages === null && <div style={{ display: 'grid', placeItems: 'center', padding: 30 }}><span className="spinner" /></div>}
        {messages?.length === 0 && (
          <div className="ice">
            <p>Начни разговор</p>
            {ICEBREAKERS[user.role].map((t, i) => (
              <motion.button key={t} className="chip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} whileTap={{ scale: 0.95 }} onClick={() => send(t)}>{t}</motion.button>
            ))}
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages?.map((m, i) => {
            const mine = m.senderId === user.id
            const next = messages[i + 1]
            const tail = !next || next.senderId !== m.senderId
            return (
              <motion.div key={m.id} className={`bubble-row ${mine ? 'mine' : ''}`}
                initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
                <div className={`bubble ${tail ? 'tail' : ''}`}>
                  {m.text}
                  <span className="bubble-meta">{clock(m.createdAt)}{mine && (m.read ? <CheckCheck size={14} /> : <Check size={14} />)}</span>
                </div>
              </motion.div>
            )
          })}
          {typing[matchId] && (
            <motion.div key="typing" className="bubble-row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bubble typing"><span /><span /><span /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input className="input" value={text} placeholder="Сообщение…" maxLength={2000}
          onChange={(e) => {
            setText(e.target.value)
            if (Date.now() - lastTyping.current > 2500) { lastTyping.current = Date.now(); sendTyping(matchId) }
          }} />
        <motion.button className="send-btn" disabled={!text.trim()} whileTap={{ scale: 0.85 }} animate={{ scale: text.trim() ? 1 : 0.9, opacity: text.trim() ? 1 : 0.5 }} aria-label="Отправить">
          <SendHorizontal size={20} />
        </motion.button>
      </form>

      <ProfileSheet user={info && !wide ? other : null} onClose={() => setInfo(false)} />
    </div>
  )

  if (!wide) return chat
  return (
    <div className="chat-split">
      {chat}
      <motion.aside className="chat-side" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
        <ProfileBody user={other} />
      </motion.aside>
    </div>
  )
}

export function ChatPlaceholder() {
  return (
    <div className="chat-empty">
      <motion.img src="/icon.svg" alt="" width={70} height={70} style={{ borderRadius: 20, opacity: 0.9 }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 0.9 }} />
      <h3>Выбери диалог</h3>
      <p>Или вернись к <Link to="/app" style={{ color: 'var(--gold)' }}>карточкам</Link></p>
    </div>
  )
}
