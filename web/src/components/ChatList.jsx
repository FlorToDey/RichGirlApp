import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '../session.jsx'
import { timeAgo } from '../api.js'
import Avatar from './Avatar.jsx'

export default function ChatList() {
  const { matches, user, typing } = useSession()
  const { id } = useParams()
  const fresh = matches.filter((m) => !m.lastMessage)
  const talks = matches.filter((m) => m.lastMessage)

  return (
    <div className="chatlist scroll">
      <div className="cl-section">
        <h4>Новые мэтчи {fresh.length > 0 && <span className="cl-count">{fresh.length}</span>}</h4>
        {fresh.length === 0 ? (
          <p className="cl-empty">{matches.length ? 'Со всеми уже общаешься' : 'Пока пусто. Свайпай вправо, мэтчи появятся тут'}</p>
        ) : (
          <div className="cl-fresh">
            {fresh.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                <Link to={`/app/chats/${m.id}`} className="cl-fresh-item">
                  <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.94 }}><Avatar user={m.user} size={66} ring online={m.user.online} /></motion.div>
                  <span>{m.user.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="cl-section">
        <h4>Сообщения</h4>
        {talks.length === 0 && <p className="cl-empty">Напиши первым, не стесняйся</p>}
        {talks.map((m, i) => {
          const last = m.lastMessage
          const mine = last.senderId === user.id
          return (
            <motion.div key={m.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <Link to={`/app/chats/${m.id}`} className={`cl-row ${Number(id) === m.id ? 'on' : ''}`}>
                <Avatar user={m.user} size={54} online={m.user.online} />
                <div className="cl-row-main">
                  <div className="cl-row-top"><strong>{m.user.name}</strong><span>{timeAgo(last.createdAt)}</span></div>
                  <div className={`cl-row-last ${m.unread ? 'unread' : ''}`}>
                    {typing[m.id] ? <em className="typing-text">печатает…</em> : <>{mine && <span className="cl-you">Ты: </span>}{last.text}</>}
                  </div>
                </div>
                {m.unread > 0 && <motion.span className="cl-unread" initial={{ scale: 0 }} animate={{ scale: 1 }}>{m.unread}</motion.span>}
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
