import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { BadgeCheck, Briefcase, Building2, Car, Gem, Heart, Home, MapPin, Sailboat, Star, Wallet, X } from 'lucide-react'
import { media, money } from '../api.js'
import { useDesktop } from '../hooks.js'

export default function ProfileSheet({ user, onClose, onAction }) {
  const desktop = useDesktop()
  const controls = useDragControls()
  return createPortal(
    <AnimatePresence>
      {user && (
        <>
          <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={`sheet ${desktop ? 'sheet-modal' : 'sheet-bottom'}`}
            initial={desktop ? { opacity: 0, scale: 0.94, y: 20 } : { y: '100%' }}
            animate={desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={desktop ? { opacity: 0, scale: 0.96, y: 10 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag={desktop ? false : 'y'} dragControls={controls} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(e, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose() }}
          >
            {!desktop && <div className="sheet-grab" onPointerDown={(e) => controls.start(e)}><div className="sheet-handle" /></div>}
            <ProfileBody user={user} />
            <motion.button className="sheet-close" onClick={onClose} whileTap={{ scale: 0.88 }} aria-label="Закрыть"><X size={20} /></motion.button>
            {onAction && (
              <div className="sheet-actions">
                <motion.button className="act act-nope act-sm" whileTap={{ scale: 0.88 }} onClick={() => onAction('nope')}><X size={24} strokeWidth={2.6} /></motion.button>
                <motion.button className="act act-super act-sm" whileTap={{ scale: 0.88 }} onClick={() => onAction('super')}><Star size={20} strokeWidth={2.4} /></motion.button>
                <motion.button className="act act-like act-sm" whileTap={{ scale: 0.88 }} onClick={() => onAction('like')}><Heart size={22} strokeWidth={2.6} /></motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function ProfileBody({ user }) {
  const [i, setI] = useState(0)
  useEffect(() => setI(0), [user?.id])
  const photos = user.photos?.length ? user.photos : [null]
  const rows = user.role === 'f' ? [
    [Car, 'Основная машина', user.mainCar],
    [Building2, 'Владелица компаний', user.companies?.length ? user.companies.join(', ') : null],
    [Briefcase, 'Источник дохода', user.incomeSource],
    [Home, 'Недвижимость', user.realty],
    [Sailboat, 'Яхта', user.yacht],
    [Wallet, 'Бюджет на парня', user.allowance ? `${money(user.allowance)} / мес` : null],
  ].filter((r) => r[2]) : []

  return (
    <div className="pbody scroll">
      <div className="pbody-photo" onClick={() => setI((v) => (v + 1) % photos.length)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {photos[i]
            ? <motion.img key={photos[i]} src={media(photos[i])} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} draggable={false} />
            : <div className="card-nophoto">{user.name?.[0]}</div>}
        </AnimatePresence>
        {photos.length > 1 && <div className="card-bars">{photos.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>}
      </div>
      <div className="pbody-content">
        <div className="card-name">
          <h2>{user.name}{user.age ? <span>, {user.age}</span> : null}</h2>
          {user.verified && <BadgeCheck size={22} className="verified" />}
        </div>
        {user.city && <div className="card-city" style={{ color: 'var(--muted)' }}><MapPin size={14} /> {user.city}</div>}

        {user.role === 'f' && (
          <motion.div className="worth-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <span>Состояние</span>
            <strong className="gold-text">{money(user.netWorth)}</strong>
            <Gem size={60} className="worth-card-gem" />
          </motion.div>
        )}

        {user.bio && <p className="pbody-bio">{user.bio}</p>}

        {rows.length > 0 && (
          <div className="facts">
            {rows.map(([Icon, label, val], k) => (
              <motion.div key={label} className="fact" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + k * 0.04 }}>
                <span className="fact-icon"><Icon size={18} /></span>
                <div><span>{label}</span><strong>{val}</strong></div>
              </motion.div>
            ))}
          </div>
        )}

        {user.skills?.length > 0 && (
          <div className="chips" style={{ marginTop: 18 }}>{user.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
        )}
      </div>
    </div>
  )
}
