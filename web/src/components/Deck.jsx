import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { BadgeCheck, Car, Gem, Heart, Info, MapPin, RotateCcw, SlidersHorizontal, Star, X } from 'lucide-react'
import { api, media, money } from '../api.js'
import { useSession } from '../session.jsx'
import ProfileSheet from './ProfileSheet.jsx'
import './deck.css'

const FILTERS = [
  [0, 'Любое'],
  [10e6, '$10 млн+'],
  [100e6, '$100 млн+'],
  [1e9, '$1 млрд+'],
]

export default function Deck() {
  const { user, showMatch } = useSession()
  const [cards, setCards] = useState(null)
  const [minWorth, setMinWorth] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [details, setDetails] = useState(null)
  const [error, setError] = useState('')
  const handles = useRef({})
  const lookingForGirls = user.role === 'm'

  const visible = cards?.slice(0, 3) || []
  const top = { current: visible[0] ? { card: visible[0], fling: (a) => handles.current[visible[0].id]?.(a) } : null }
  const topRef = useRef(top)
  topRef.current = top.current

  const load = useCallback(async () => {
    setError('')
    try {
      setCards(await api(`/feed?minWorth=${minWorth}`))
    } catch (e) {
      setError(e.message)
      setCards([])
    }
  }, [minWorth])

  useEffect(() => { setCards(null); load() }, [load])

  const swiped = useCallback(async (card, action) => {
    setCards((list) => list.filter((c) => c.id !== card.id))
    try {
      const res = await api('/swipe', { method: 'POST', body: { targetId: card.id, action } })
      if (res.match) setTimeout(() => showMatch(res.match), 250)
    } catch { /* card is gone anyway */ }
  }, [showMatch])

  useEffect(() => {
    if (cards && cards.length === 3) api(`/feed?minWorth=${minWorth}`).then((more) => {
      setCards((list) => {
        const add = more.filter((m) => !list.some((c) => c.id === m.id))
        return add.length ? [...list, ...add] : list
      })
    }).catch(() => {})
  }, [cards, minWorth])

  useEffect(() => {
    const onKey = (e) => {
      if (details || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') topRef.current?.fling('nope')
      if (e.key === 'ArrowRight') topRef.current?.fling('like')
      if (e.key === 'ArrowUp') topRef.current?.fling('super')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [details])

  const restart = async () => {
    setCards(null)
    await api('/feed/reset', { method: 'POST' }).catch(() => {})
    load()
  }


  return (
    <div className="deck-wrap">
      {lookingForGirls && (
        <div className="deck-filter">
          <motion.button className={`chip ${minWorth ? 'on' : ''}`} whileTap={{ scale: 0.94 }} onClick={() => setFilterOpen((o) => !o)}>
            <SlidersHorizontal size={15} /> Состояние: {FILTERS.find((f) => f[0] === minWorth)[1]}
          </motion.button>
          <AnimatePresence>
            {filterOpen && (
              <motion.div className="filter-pop" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.2 }}>
                {FILTERS.map(([v, label]) => (
                  <button key={v} className={`filter-item ${v === minWorth ? 'on' : ''}`} onClick={() => { setMinWorth(v); setFilterOpen(false) }}>{label}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="deck">
        {cards === null && <div className="deck-empty"><span className="spinner" /></div>}
        {cards && cards.length === 0 && (
          <motion.div className="deck-empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="radar"><span /><span /><img src="/icon.svg" alt="" /></div>
            <h3>{error || (lookingForGirls ? 'Богатые закончились' : 'Пока никого нового')}</h3>
            <p>{lookingForGirls ? 'Новые миллионерши регистрируются каждый день. Или пересмотри тех, кого пропустил.' : 'Скоро тут будут новые парни.'}</p>
            <motion.button className="btn btn-ghost btn-sm" whileTap={{ scale: 0.95 }} onClick={restart}><RotateCcw size={16} /> Начать заново</motion.button>
          </motion.div>
        )}
        <AnimatePresence>
          {visible.map((card, i) => (
            <SwipeCard key={card.id} handles={handles} card={card} depth={i} onSwiped={swiped} onInfo={() => setDetails(card)} />
          )).reverse()}
        </AnimatePresence>
      </div>

      <div className="deck-actions">
        <ActionBtn kind="nope" disabled={!visible.length} onClick={() => top.current?.fling('nope')}><X size={30} strokeWidth={2.6} /></ActionBtn>
        <ActionBtn kind="super" disabled={!visible.length} onClick={() => top.current?.fling('super')}><Star size={22} strokeWidth={2.4} /></ActionBtn>
        <ActionBtn kind="like" disabled={!visible.length} onClick={() => top.current?.fling('like')}><Heart size={28} strokeWidth={2.6} /></ActionBtn>
      </div>

      <ProfileSheet user={details} onClose={() => setDetails(null)}
        onAction={(action) => { const c = details; setDetails(null); setTimeout(() => (top.current?.card.id === c.id ? top.current.fling(action) : swiped(c, action)), 250) }} />
    </div>
  )
}

function ActionBtn({ kind, children, ...rest }) {
  return (
    <motion.button className={`act act-${kind}`} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }} {...rest}>
      {children}
    </motion.button>
  )
}

function SwipeCard({ card, depth, onSwiped, onInfo, handles }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-14, 0, 14])
  const likeOpacity = useTransform(x, [30, 110], [0, 1])
  const nopeOpacity = useTransform(x, [-110, -30], [1, 0])
  const superOpacity = useTransform(y, [-120, -40], [1, 0])
  const [photo, setPhoto] = useState(0)
  const gone = useRef(false)
  const photos = card.photos.length ? card.photos : [null]

  const fling = useCallback((action) => {
    if (gone.current) return
    gone.current = true
    const w = window.innerWidth
    const opts = { duration: 0.42, ease: [0.32, 0.72, 0, 1] }
    if (action === 'super') animate(y, -window.innerHeight, opts)
    else animate(x, action === 'like' ? w : -w, opts)
    setTimeout(() => onSwiped(card, action), 260)
  }, [card, onSwiped, x, y])

  useEffect(() => {
    handles.current[card.id] = fling
    return () => { if (handles.current[card.id] === fling) delete handles.current[card.id] }
  }, [handles, card.id, fling])

  const onDragEnd = (e, info) => {
    if (info.offset.y < -130 && Math.abs(info.offset.x) < 90) return fling('super')
    if (info.offset.x > 110 || info.velocity.x > 600) return fling('like')
    if (info.offset.x < -110 || info.velocity.x < -600) return fling('nope')
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
    animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 })
  }

  const tapPhoto = (e) => {
    if (Math.abs(x.get()) > 4) return
    const rect = e.currentTarget.getBoundingClientRect()
    const right = e.clientX - rect.left > rect.width / 2
    setPhoto((p) => Math.max(0, Math.min(photos.length - 1, p + (right ? 1 : -1))))
  }

  const isTop = depth === 0
  return (
    <motion.div
      className="card"
      style={{ x, y, rotate, zIndex: 10 - depth }}
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.045, y: depth * 14, opacity: depth > 1 ? 0.6 : 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      drag={isTop}
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={onDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <div className="card-photo" onClick={tapPhoto}>
        {photos[photo]
          ? <img src={media(photos[photo])} alt="" draggable={false} />
          : <div className="card-nophoto">{card.name?.[0]}</div>}
        {photos.length > 1 && (
          <div className="card-bars">{photos.map((_, i) => <span key={i} className={i === photo ? 'on' : ''} />)}</div>
        )}
      </div>

      <motion.div className="stamp stamp-like" style={{ opacity: likeOpacity }}>LIKE</motion.div>
      <motion.div className="stamp stamp-nope" style={{ opacity: nopeOpacity }}>NOPE</motion.div>
      <motion.div className="stamp stamp-super" style={{ opacity: superOpacity }}>SUPER</motion.div>

      <div className="card-info">
        <div className="card-name">
          <h2>{card.name}{card.age ? <span>, {card.age}</span> : null}</h2>
          {card.verified && <BadgeCheck size={22} className="verified" />}
          <motion.button className="card-more" whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onInfo() }} onPointerDown={(e) => e.stopPropagation()} aria-label="Подробнее"><Info size={20} /></motion.button>
        </div>
        {card.city && <div className="card-city"><MapPin size={14} /> {card.city}{card.online && <><span className="dot-online" /> онлайн</>}</div>}
        {card.role === 'f' ? (
          <div className="card-wealth">
            <span className="wealth-main"><Gem size={15} /> {money(card.netWorth)}</span>
            {card.mainCar && <span className="wealth-car"><Car size={14} /> {card.mainCar}</span>}
          </div>
        ) : card.skills?.length ? (
          <div className="card-skills">{card.skills.slice(0, 3).map((s) => <span key={s}>{s}</span>)}</div>
        ) : null}
        {card.bio && <p className="card-bio">{card.bio}</p>}
      </div>
    </motion.div>
  )
}
