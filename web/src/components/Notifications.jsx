import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, Heart, MessageCircle, Sparkles, Star } from 'lucide-react'
import { useSession } from '../session.jsx'
import { media, timeAgo } from '../api.js'
import { useDesktop } from '../hooks.js'

const ICONS = { match: Sparkles, message: MessageCircle, like: Heart, super: Star, system: Sparkles }

export default function Notifications() {
  const { notifications, markNotificationsRead } = useSession()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const desktop = useDesktop()
  const box = useRef(null)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open || !desktop) return
    const fn = (e) => { if (!box.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', fn)
    return () => document.removeEventListener('pointerdown', fn)
  }, [open, desktop])

  const toggle = () => {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (unread) setTimeout(markNotificationsRead, 1200)
  }

  const go = (n) => {
    setOpen(false)
    if ((n.type === 'match' || n.type === 'message') && n.refId) navigate(`/app/chats/${n.refId}`)
    else if (n.type === 'like') navigate('/app')
  }

  const list = (
    <>
      <div className="notif-head">
        <strong>Уведомления</strong>
        {unread > 0 && <button onClick={markNotificationsRead}>Прочитать все</button>}
      </div>
      <div className="notif-list scroll">
        {notifications.length === 0 && <p className="cl-empty" style={{ padding: '30px 20px', textAlign: 'center' }}>Пока тихо. Скоро начнётся</p>}
        {notifications.map((n, i) => {
          const Icon = ICONS[n.type] || Bell
          return (
            <motion.button key={n.id} className={`notif ${n.read ? '' : 'new'}`} onClick={() => go(n)}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.025 }}>
              <span className={`notif-icon t-${n.type}`}>
                {n.image ? <img src={media(n.image)} alt="" /> : <Icon size={18} />}
              </span>
              <span className="notif-text">
                <strong>{n.title}</strong>
                {n.body && <span>{n.body}</span>}
                <em>{timeAgo(n.createdAt)}</em>
              </span>
              {!n.read && <span className="notif-dot" />}
            </motion.button>
          )
        })}
      </div>
    </>
  )

  return (
    <div className="bell-wrap" ref={box}>
      <motion.button className="icon-btn bell" onClick={toggle} whileTap={{ scale: 0.88 }} aria-label="Уведомления"
        animate={unread ? { rotate: [0, -14, 12, -8, 6, 0] } : {}} transition={{ duration: 0.7 }} key={unread}>
        <Bell size={22} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <AnimatePresence>
        {open && desktop && (
          <motion.div className="notif-pop" initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            {list}
          </motion.div>
        )}
      </AnimatePresence>
      {createPortal(
        <AnimatePresence>
          {open && !desktop && (
            <>
              <motion.div key="nb" className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <motion.div key="ns" className="notif-sheet" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ type: 'spring', stiffness: 340, damping: 36 }}>
                {list}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
