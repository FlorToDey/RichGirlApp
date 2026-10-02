import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Gem, Home, MapPin, Pencil, Sailboat, Star, Building2 } from 'lucide-react'
import { useSession } from '../session.jsx'
import { api, media, money } from '../api.js'
import PhotoPicker from '../components/PhotoPicker.jsx'
import { AgeWheel, AutoInput, CarsField, ListField, OptionalField } from '../components/fields.jsx'
import { BUSINESSES, CARS, CITIES, REALTY, SKILLS, YACHTS } from '../data.js'
import './onboarding.css'

const ease = [0.22, 1, 0.36, 1]
const WORTH_PRESETS = [10e6, 100e6, 1e9, 10e9]
const ALLOWANCE = [1000, 5000, 20000, 100000]

const toWorth = (v) => {
  const raw = Math.pow(10, 6 + v / 20)
  const mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1)
  return Math.round(raw / mag) * mag
}
const toSlider = (w) => Math.max(0, Math.min(100, (Math.log10(w || 1e6) - 6) * 20))

const years = (n) => {
  const d = n % 10, h = n % 100
  if (d === 1 && h !== 11) return `${n} год`
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return `${n} года`
  return `${n} лет`
}

function fromUser(u) {
  return {
    role: u.role || null,
    name: u.name || '',
    age: u.age || null,
    city: u.city || '',
    bio: u.bio || '',
    photos: u.photos || [],
    skills: u.skills || [],
    netWorth: u.netWorth || 50e6,
    companies: u.companies?.length ? u.companies : [''],
    cars: u.cars?.length ? u.cars : [{ name: '', main: true }],
    realty: u.realty || '',
    yacht: u.yacht || '',
    allowance: u.allowance || 5000,
  }
}

function buildSteps(role, edit) {
  const list = edit ? [] : ['role']
  list.push('name', 'age', 'city', 'photos', 'bio')
  if (role === 'f') list.push('wealth', 'business', 'cars', 'extras', 'allowance')
  return list
}

function question(id, role) {
  const f = role === 'f'
  return {
    role: 'Привет! Я GoldDigg 💎 Для начала: кто ты в этой истории?',
    name: f ? 'Как к вам обращаться, королева?' : 'Отлично. Как тебя зовут?',
    age: 'Сколько тебе лет?',
    city: f ? 'Где живёшь? Ну, или где сейчас стоит яхта' : 'Из какого ты города?',
    photos: f ? 'Теперь фото. С яхты особенно приветствуются' : 'Покажи себя. Можно пропустить, но с фото мэтчей сильно больше',
    bio: f ? 'Пара слов о себе и о том, кого ищешь' : 'Пара слов о себе. Чем зацепишь?',
    wealth: 'Самое важное. Какое у тебя состояние?',
    business: 'Откуда деньги? Перечисли свои бизнесы',
    cars: 'Что в гараже? Основную отметь закладкой',
    extras: 'Яхта, недвижимость? Если нет, просто жми дальше',
    allowance: 'И последнее: сколько готова тратить на парня в месяц?',
  }[id]
}

export default function Onboarding() {
  const { user, setUser } = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const edit = params.has('edit') && user.onboarded
  const [form, setForm] = useState(() => fromUser(user))
  const steps = useMemo(() => buildSteps(form.role, edit), [form.role, edit])
  const [reached, setReached] = useState(() => (edit ? buildSteps(user.role, true).length : 0))
  const [active, setActive] = useState(edit ? -1 : 0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const scroller = useRef(null)
  const blocks = useRef({})
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const done = reached >= steps.length

  // new question -> glide to the bottom; editing an old one -> bring it into view
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const t = setTimeout(() => {
      if (active >= 0 && active < reached) blocks.current[steps[active]]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, 120)
    return () => clearTimeout(t)
  }, [active, reached, steps])

  function validate(id) {
    if (id === 'name' && !form.name.trim()) return 'Без имени никак'
    if (id === 'wealth' && !form.netWorth) return 'Укажи состояние'
    return ''
  }

  function complete(i, roleOverride) {
    const id = steps[i]
    const err = validate(id)
    setError(err)
    if (err) return
    const total = buildSteps(roleOverride || form.role, edit).length
    if (i >= reached) {
      setReached(i + 1)
      setActive(i + 1 < total ? i + 1 : -1)
    } else {
      setActive(reached < total ? reached : -1)
    }
  }

  async function submit() {
    setError('')
    setBusy(true)
    try {
      const body = {
        ...form,
        companies: form.companies.map((c) => c.trim()).filter(Boolean),
        cars: form.cars.filter((c) => c.name.trim()),
      }
      const u = await api('/me', { method: 'PUT', body })
      setUser(u)
      navigate(edit ? '/app/profile' : '/app', { replace: true })
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const visible = steps.slice(0, Math.min(reached + 1, steps.length))

  return (
    <div className="flow-page">
      <div className="flow-top">
        <motion.button className="icon-btn" whileTap={{ scale: 0.88 }} onClick={() => navigate(edit ? '/app/profile' : '/')} style={{ visibility: edit ? 'visible' : 'hidden' }} aria-label="Назад"><ArrowLeft size={20} /></motion.button>
        <div className="onb-progress">
          <motion.div className="onb-progress-fill" animate={{ width: `${(Math.min(reached, steps.length) / steps.length) * 100}%` }} transition={{ duration: 0.6, ease }} />
        </div>
        <span className="onb-count">{Math.min(reached, steps.length)}/{steps.length}</span>
      </div>

      <div className="flow scroll" ref={scroller}>
        <LayoutGroup>
          <div className="flow-inner">
            {edit && <BotLine fresh={false}>Это твоя анкета. Нажми на любой ответ, чтобы поменять</BotLine>}
            {visible.map((id, i) => (
              <div className="flow-step" key={id} ref={(el) => { blocks.current[id] = el }}>
                <BotLine fresh={!edit && i === reached && i === active}>{question(id, form.role)}</BotLine>
                <AnimatePresence mode="popLayout" initial={false}>
                  {active === i ? (
                    <StepInput key="in" id={id} form={form} set={set} setForm={setForm} error={error}
                      onNext={(roleOverride) => complete(i, roleOverride)} />
                  ) : i < reached ? (
                    <Answer key="ans" id={id} form={form} onEdit={() => { setError(''); setActive(i) }} />
                  ) : null}
                </AnimatePresence>
              </div>
            ))}

            <AnimatePresence>
              {done && active === -1 && (
                <motion.div className="flow-step" key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <BotLine fresh={!edit}>{edit ? 'Всё верно? Сохраняем' : form.role === 'f' ? 'Готово! Парни уже в очереди. Вот так тебя увидят 👇' : 'Готово! Вот так тебя увидят богатые 👇'}</BotLine>
                  <motion.div className="final" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: edit ? 0 : 0.7, duration: 0.6, ease }}>
                    <MiniCard form={form} />
                    {error && <div className="error-text">{error}</div>}
                    <motion.button className="btn btn-gold btn-block" disabled={busy} onClick={submit} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}>
                      {busy ? <span className="spinner" style={{ width: 20, height: 20, borderTopColor: '#2a1a06' }} /> : edit ? 'Сохранить' : <>Начать свайпать <ArrowRight size={18} /></>}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </div>
    </div>
  )
}

function BotLine({ children, fresh }) {
  const [typing, setTyping] = useState(fresh)
  useEffect(() => {
    if (!fresh) return
    const t = setTimeout(() => setTyping(false), 650)
    return () => clearTimeout(t)
  }, [fresh])
  return (
    <motion.div className="bot-row" initial={fresh ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
      <img src="/icon.svg" alt="" className="bot-ava" />
      <motion.div className="bot-bubble" layout transition={{ duration: 0.25 }}>
        {typing ? <span className="dots"><span /><span /><span /></span> : <motion.span initial={fresh ? { opacity: 0 } : false} animate={{ opacity: 1 }}>{children}</motion.span>}
      </motion.div>
    </motion.div>
  )
}

function Card({ children, onNext, nextLabel = 'Дальше', error, delay = 0.55 }) {
  return (
    <motion.div className="step-card" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }} transition={{ delay, duration: 0.45, ease }}>
      {children}
      <div className="step-foot">
        <AnimatePresence>{error && <motion.span className="error-text" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>{error}</motion.span>}</AnimatePresence>
        <motion.button type="button" className="next-pill" onClick={() => onNext()} whileTap={{ scale: 0.94 }} whileHover={{ x: 2 }}>
          {nextLabel} <ArrowRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  )
}

function StepInput({ id, form, set, setForm, onNext, error }) {
  if (id === 'role') return <RolePicker onPick={(role) => { set({ role }); onNext(role) }} current={form.role} />

  if (id === 'name') return (
    <Card onNext={onNext} error={error}>
      <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Имя" maxLength={40} autoFocus
        onKeyDown={(e) => e.key === 'Enter' && onNext()} />
    </Card>
  )
  if (id === 'age') return (
    <Card onNext={onNext}>
      <AgeWheel value={form.age} onChange={(age) => set({ age })} />
    </Card>
  )
  if (id === 'city') return (
    <Card onNext={onNext} nextLabel={form.city.trim() ? 'Дальше' : 'Пропустить'}>
      <AutoInput value={form.city} onChange={(city) => set({ city })} options={CITIES} placeholder="Город" icon={MapPin} autoFocus onEnter={onNext} />
    </Card>
  )
  if (id === 'photos') return (
    <Card onNext={onNext} nextLabel={form.photos.length ? 'Дальше' : 'Пропустить'}>
      <PhotoPicker value={form.photos} onChange={(photos) => set({ photos })} />
    </Card>
  )
  if (id === 'bio') return (
    <Card onNext={onNext} nextLabel={form.bio.trim() || form.skills.length ? 'Дальше' : 'Пропустить'}>
      <textarea className="input" value={form.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={500} autoFocus
        placeholder={form.role === 'f' ? 'Ищу того, кто будет напоминать мне пить воду…' : 'Умею красиво молчать на ужинах…'} />
      {form.role === 'm' && (
        <div className="field" style={{ marginTop: 14 }}>
          <span>Что умеешь</span>
          <div className="chips">
            {SKILLS.map((s) => {
              const on = form.skills.includes(s)
              return (
                <motion.button type="button" key={s} className={`chip ${on ? 'on' : ''}`} whileTap={{ scale: 0.92 }}
                  onClick={() => setForm((f) => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s].slice(0, 8) }))}>{s}</motion.button>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
  if (id === 'wealth') return (
    <Card onNext={onNext} error={error}>
      <div className="worth-box">
        <Gem size={22} className="worth-gem" />
        <motion.div key={form.netWorth} className="worth-value gold-text" initial={{ y: 8, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
          {money(form.netWorth)}
        </motion.div>
        <GoldSlider value={toSlider(form.netWorth)} onChange={(v) => set({ netWorth: toWorth(v) })} />
        <div className="chips" style={{ justifyContent: 'center' }}>
          {WORTH_PRESETS.map((w) => (
            <motion.button type="button" key={w} whileTap={{ scale: 0.92 }} className={`chip ${form.netWorth === w ? 'on' : ''}`} onClick={() => set({ netWorth: w })}>{money(w)}</motion.button>
          ))}
        </div>
      </div>
    </Card>
  )
  if (id === 'business') return (
    <Card onNext={onNext} nextLabel={form.companies.some((c) => c.trim()) ? 'Дальше' : 'Пропустить'}>
      <ListField value={form.companies} onChange={(companies) => set({ companies })} options={BUSINESSES} placeholder="Например, сеть кофеен" addLabel="Добавить бизнес" icon={Building2} />
    </Card>
  )
  if (id === 'cars') return (
    <Card onNext={onNext} nextLabel={form.cars.some((c) => c.name.trim()) ? 'Дальше' : 'Пропустить'}>
      <CarsField value={form.cars} onChange={(cars) => set({ cars })} options={CARS} />
    </Card>
  )
  if (id === 'extras') return (
    <Card onNext={onNext} nextLabel={form.yacht || form.realty ? 'Дальше' : 'Пропустить'}>
      <div className="form-stack">
        <OptionalField label="Яхта" addLabel="Добавить яхту" value={form.yacht} onChange={(yacht) => set({ yacht })} options={YACHTS} placeholder="Например, Feadship, 60 м" icon={Sailboat} />
        <OptionalField label="Недвижимость" addLabel="Добавить недвижимость" value={form.realty} onChange={(realty) => set({ realty })} options={REALTY} placeholder="Например, вилла в Ницце" icon={Home} />
      </div>
    </Card>
  )
  if (id === 'allowance') return (
    <Card onNext={onNext}>
      <div className="allow-grid">
        {ALLOWANCE.map((a) => (
          <motion.button type="button" key={a} whileTap={{ scale: 0.95 }} className={`allow ${form.allowance === a ? 'on' : ''}`} onClick={() => set({ allowance: a })}>
            <strong>{money(a)}</strong><span>в месяц</span>
            {form.allowance === a && <motion.span layoutId="allow-ring" className="allow-ring" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
          </motion.button>
        ))}
      </div>
    </Card>
  )
  return null
}

const ROLES = [
  { id: 'm', emoji: '🕺', title: 'Я парень', text: 'Ищу богатую. Готов к яхтам, ужинам и шпицам.' },
  { id: 'f', emoji: '👑', title: 'Я девушка', text: 'У меня есть всё. Осталось найти, кому это отдать.' },
]

function RolePicker({ onPick, current }) {
  const [picked, setPicked] = useState(null)
  const [leaving, setLeaving] = useState(false)

  const pick = (r) => {
    if (picked) return
    setPicked(r)
    setTimeout(() => setLeaving(true), 900)
    setTimeout(() => onPick(r), 1250)
  }

  return (
    <motion.div className="role-grid" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ delay: 0.55, duration: 0.45, ease }}>
      {ROLES.map((r) => {
        const on = picked === r.id
        const off = picked && !on
        return (
          <motion.button type="button" key={r.id} layoutId={`role-${r.id}`}
            className={`role-card ${on ? 'picked' : ''} ${current === r.id && !picked ? 'was' : ''}`}
            style={{ borderRadius: 24 }}
            onClick={() => pick(r.id)}
            animate={off ? { opacity: leaving ? 0 : 0.18, scale: leaving ? 0.88 : 0.94, y: leaving ? 18 : 10, filter: 'grayscale(1)' } : on ? { y: -4 } : { opacity: 1, scale: 1, y: 0, filter: 'grayscale(0)' }}
            whileHover={picked ? undefined : { rotate: [0, -2.2, 2.2, -1.4, 1.4, 0], y: -3, transition: { duration: 0.5 } }}
            whileTap={picked ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.5, ease, layout: { duration: 0.55, ease } }}>
            {on && (
              <>
                <motion.span className="role-tint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
                <svg className="role-trace" aria-hidden>
                  <defs>
                    <linearGradient id={`trace-${r.id}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fff0c4" /><stop offset=".5" stopColor="#f3c969" /><stop offset="1" stopColor="#c47d2e" />
                    </linearGradient>
                  </defs>
                  <motion.rect x="1" y="1" rx="23" fill="none" stroke={`url(#trace-${r.id})`} strokeWidth="2"
                    style={{ width: 'calc(100% - 2px)', height: 'calc(100% - 2px)' }}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.75, ease: 'easeInOut' }} />
                </svg>
                <motion.span className="role-shine" initial={{ x: '-130%' }} animate={{ x: '130%' }} transition={{ delay: 0.35, duration: 0.8, ease: 'easeInOut' }} />
                <motion.span className="role-seal" initial={{ scale: 0, rotate: -40, opacity: 0 }} animate={{ scale: [0, 1.25, 1], rotate: 0, opacity: 1 }} transition={{ delay: 0.45, duration: 0.5, ease }}>
                  <Check size={16} strokeWidth={3} />
                </motion.span>
              </>
            )}
            <motion.span className="role-emoji" animate={on ? { scale: [1, 1.18, 1.08], rotate: [0, -8, 0] } : {}} transition={{ duration: 0.6 }}>{r.emoji}</motion.span>
            <strong>{r.title}</strong>
            <span className="role-text">{r.text}</span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

function GoldSlider({ value, onChange }) {
  const track = useRef(null)
  const dragging = useRef(false)
  const setFrom = (clientX) => {
    const r = track.current.getBoundingClientRect()
    onChange(Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * 100))
  }
  return (
    <div className="gslider" ref={track} role="slider" tabIndex={0} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} aria-label="Состояние"
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); setFrom(e.clientX) }}
      onPointerMove={(e) => dragging.current && setFrom(e.clientX)}
      onPointerUp={() => { dragging.current = false }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onChange(Math.min(100, value + 2))
        if (e.key === 'ArrowLeft') onChange(Math.max(0, value - 2))
      }}>
      <div className="gslider-rail" />
      <div className="gslider-fill" style={{ width: `${value}%` }} />
      <motion.div className="gslider-thumb" style={{ left: `${value}%` }} whileTap={{ scale: 1.15 }}><Gem size={14} /></motion.div>
    </div>
  )
}

function Answer({ id, form, onEdit }) {
  let content
  if (id === 'role') {
    const r = ROLES.find((x) => x.id === form.role)
    return (
      <div className="me-row">
        <motion.button type="button" layoutId={`role-${form.role}`} className="me-bubble me-role" style={{ borderRadius: 20 }} onClick={onEdit}
          transition={{ layout: { duration: 0.55, ease } }}>
          <motion.span layout="position">{r.emoji}</motion.span> <motion.span layout="position">{r.title}</motion.span>
        </motion.button>
      </div>
    )
  }
  const cars = form.cars.filter((c) => c.name.trim())
  const companies = form.companies.filter((c) => c.trim())
  switch (id) {
    case 'name': content = form.name; break
    case 'age': content = years(form.age || 25); break
    case 'city': content = form.city || 'Не скажу'; break
    case 'photos': content = form.photos.length
      ? <span className="me-photos">{form.photos.slice(0, 4).map((p) => <img key={p} src={media(p)} alt="" />)}{form.photos.length > 4 && <em>+{form.photos.length - 4}</em>}</span>
      : 'Пока без фото'; break
    case 'bio': content = form.bio || form.skills.length ? <span className="me-bio">{form.bio}{form.skills.length > 0 && <span className="me-chips">{form.skills.map((s) => <i key={s}>{s}</i>)}</span>}</span> : 'Пропущу'; break
    case 'wealth': content = <span className="me-worth"><Gem size={15} /> {money(form.netWorth)}</span>; break
    case 'business': content = companies.length ? companies.join(', ') : 'Секрет'; break
    case 'cars': content = cars.length ? <span className="me-cars">{cars.map((c) => <span key={c.name}>{c.main && <Star size={12} fill="currentColor" />} {c.name}</span>)}</span> : 'Езжу на такси'; break
    case 'extras': content = form.yacht || form.realty ? [form.yacht && `Яхта: ${form.yacht}`, form.realty && `Недвижимость: ${form.realty}`].filter(Boolean).join(' · ') : 'Ни яхты, ни виллы. Пока'; break
    case 'allowance': content = `${money(form.allowance)} в месяц`; break
    default: content = null
  }
  return (
    <motion.div className="me-row" initial={{ opacity: 0, x: 24, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }} transition={{ duration: 0.4, ease }}>
      <motion.button type="button" className="me-bubble" onClick={onEdit} whileTap={{ scale: 0.97 }}>
        {content}
        <Pencil size={13} className="me-edit" />
      </motion.button>
    </motion.div>
  )
}

function MiniCard({ form }) {
  const main = form.cars.find((c) => c.main && c.name.trim())
  return (
    <div className="mini-card">
      {form.photos[0] ? <img src={media(form.photos[0])} alt="" /> : <div className="card-nophoto" style={{ fontSize: 80 }}>{form.name?.[0]}</div>}
      <div className="mini-info">
        <h3>{form.name}{form.age ? <span>, {form.age}</span> : null}</h3>
        {form.city && <div className="card-city"><MapPin size={13} /> {form.city}</div>}
        {form.role === 'f' && (
          <div className="card-wealth">
            <span className="wealth-main"><Gem size={14} /> {money(form.netWorth)}</span>
            {main && <span className="wealth-car">{main.name}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
