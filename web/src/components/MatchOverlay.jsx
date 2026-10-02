import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useSession } from '../session.jsx'
import { media } from '../api.js'
import './match.css'

const ease = [0.22, 1, 0.36, 1]
const sparkles = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: (i % 7) * 0.35,
  size: 3 + (i % 3) * 2,
  dur: 4 + (i % 4),
}))

export default function MatchOverlay() {
  const { matchEvent, showMatch, user } = useSession()
  const navigate = useNavigate()
  const other = matchEvent?.user
  const close = () => showMatch(null)

  return (
    <AnimatePresence>
      {matchEvent && (
        <motion.div className="match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
          <motion.div className="match-bg" style={{ backgroundImage: other?.photos?.[0] ? `url(${media(other.photos[0])})` : undefined }}
            initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease }} />
          {sparkles.map((s, i) => (
            <motion.span key={i} className="spark" style={{ left: s.left, width: s.size, height: s.size }}
              initial={{ y: '105vh', opacity: 0 }} animate={{ y: '-10vh', opacity: [0, 1, 1, 0] }}
              transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'linear' }} />
          ))}

          <div className="match-content">
            <motion.h1 className="match-title" initial={{ scale: 0.6, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}>
              It's a Match!
            </motion.h1>

            <div className="match-avatars">
              <motion.div className="match-av" initial={{ x: -120, opacity: 0, rotate: -20 }} animate={{ x: 0, opacity: 1, rotate: -6 }} transition={{ duration: 0.8, ease, delay: 0.25 }}>
                {user.photos?.[0] ? <img src={media(user.photos[0])} alt="" /> : <span>{user.name?.[0]}</span>}
              </motion.div>
              <motion.div className="match-heart" initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }} transition={{ duration: 0.6, delay: 0.75 }}>
                <img src="/icon.svg" alt="" />
              </motion.div>
              <motion.div className="match-av" initial={{ x: 120, opacity: 0, rotate: 20 }} animate={{ x: 0, opacity: 1, rotate: 6 }} transition={{ duration: 0.8, ease, delay: 0.25 }}>
                {other?.photos?.[0] ? <img src={media(other.photos[0])} alt="" /> : <span>{other?.name?.[0]}</span>}
              </motion.div>
            </div>

            <motion.div className="match-names" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6, ease }}>
              <strong>{user.name}</strong> <span>и</span> <strong>{other?.name}</strong>
              <p>понравились друг другу</p>
            </motion.div>

            <motion.div className="match-btns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6, ease }}>
              <motion.button className="btn btn-gold btn-block" whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }} onClick={() => { close(); navigate(`/app/chats/${matchEvent.id}`) }}>
                <MessageCircle size={19} /> Написать {other?.name}
              </motion.button>
              <motion.button className="btn btn-ghost btn-block" whileTap={{ scale: 0.97 }} onClick={close}>Свайпать дальше</motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
