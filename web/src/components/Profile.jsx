import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LogOut, Pencil, Trash2 } from 'lucide-react'
import { useSession } from '../session.jsx'
import { api } from '../api.js'
import { ProfileBody } from './ProfileSheet.jsx'

export default function Profile() {
  const { user, logout } = useSession()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)

  const remove = async () => {
    await api('/me', { method: 'DELETE' }).catch(() => {})
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="profile scroll">
      <div className="profile-inner">
        <div className="profile-head">
          <div>
            <h2>Моя анкета</h2>
            <span>@{user.login} · {user.role === 'f' ? 'девушка' : 'парень'}</span>
          </div>
          <motion.button className="btn btn-gold btn-sm" whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }} onClick={() => navigate('/onboarding?edit=1')}>
            <Pencil size={16} /> Изменить
          </motion.button>
        </div>
        <div className="profile-card">
          <ProfileBody user={user} />
        </div>
        <div className="profile-actions">
          <motion.button className="btn btn-ghost btn-block" whileTap={{ scale: 0.97 }} onClick={() => { logout(); navigate('/', { replace: true }) }}>
            <LogOut size={18} /> Выйти
          </motion.button>
          <button className="danger-link" onClick={() => setConfirm(true)}><Trash2 size={15} /> Удалить аккаунт</button>
        </div>
      </div>
      {createPortal(<AnimatePresence>
        {confirm && (
          <>
            <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(false)} />
            <motion.div className="confirm" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h3>Удалить аккаунт?</h3>
              <p>Анкета, мэтчи и переписки пропадут навсегда. Даже яхты.</p>
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Отмена</button>
                <button className="btn btn-sm" style={{ background: 'var(--red)' }} onClick={remove}>Удалить</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>, document.body)}
    </div>
  )
}
