import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../session.jsx'
import { media } from '../api.js'

export default function Toast() {
  const { toast, setToast } = useSession()
  const navigate = useNavigate()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast, setToast])

  return (
    <AnimatePresence>
      {toast && (
        <motion.button key={toast.key} className="toast"
          initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          drag="y" dragConstraints={{ top: 0, bottom: 0 }} onDragEnd={(e, i) => i.offset.y < -20 && setToast(null)}
          onClick={() => { setToast(null); if (toast.type === 'message' && toast.refId) navigate(`/app/chats/${toast.refId}`) }}>
          {toast.image ? <img src={media(toast.image)} alt="" /> : <img src="/icon.svg" alt="" style={{ borderRadius: 12 }} />}
          <span><strong>{toast.title}</strong>{toast.body && <span>{toast.body}</span>}</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
