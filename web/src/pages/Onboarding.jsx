import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Car, Crown, Gem, Sailboat, Building2, Wallet, Briefcase, Home } from 'lucide-react'
import { useSession } from '../session.jsx'
import { api, money } from '../api.js'
import PhotoPicker from '../components/PhotoPicker.jsx'
import TagInput from '../components/TagInput.jsx'
import './onboarding.css'

const ease = [0.22, 1, 0.36, 1]
const SKILLS = ['Ношу сумки', 'Красиво молчу', 'Готовлю', 'Массаж', 'Фотограф для сторис', 'Права категории B', 'Знаю вина', 'Танцы', 'Гитара', 'Пресс', 'Слушаю', 'Не храплю']
const WORTH_PRESETS = [10e6, 100e6, 1e9, 10e9]
const ALLOWANCE = [1000, 5000, 20000, 100000]

// slider 0..100 <-> $1M..$100B on a log scale
const toWorth = (v) => {
  const raw = Math.pow(10, 6 + v / 20)
  const mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1)
  return Math.round(raw / mag) * mag
}
const toSlider = (w) => Math.max(0, Math.min(100, (Math.log10(w || 1e6) - 6) * 20))

function fromUser(u) {
  return {
    role: u.role || null,
    name: u.name || '',
    age: u.age || '',
    city: u.city || '',
    bio: u.bio || '',
    photos: u.photos || [],
    skills: u.skills || [],
    netWorth: u.netWorth || 50e6,
    incomeSource: u.incomeSource || '',
    mainCar: u.mainCar || '',
    companies: u.companies || [],
    realty: u.realty || '',
    yacht: u.yacht || '',
    allowance: u.allowance || 5000,
  }
}

export default function Onboarding() {
  const { user, setUser } = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const edit = params.has('edit') && user.onboarded
  const [form, setForm] = useState(() => fromUser(user))
  const [[step, dir], setStep] = useState([0, 1])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const steps = useMemo(() => {
    const list = edit ? [] : ['role']
    list.push('basics', 'photos', 'about')
    if (form.role === 'f') list.push('wealth', 'assets')
    return list
  }, [form.role, edit])
  const current = steps[step]
  const last = step === steps.length - 1

  function validate() {
    if (current === 'role' && !form.role) return 'Выбери, кто ты'
    if (current === 'basics') {
      if (!form.name.trim()) return 'Как тебя зовут?'
      if (form.age && (form.age < 18 || form.age > 99)) return 'Возраст от 18 лет'
    }
    if (current === 'wealth' && !form.netWorth) return 'Укажи состояние'
    return ''
  }

  async function next() {
    const err = validate()
    setError(err)
    if (err) return
    if (!last) return setStep([step + 1, 1])
    setBusy(true)
    try {
      const u = await api('/me', { method: 'PUT', body: { ...form, age: form.age ? Number(form.age) : null } })
      setUser(u)
      navigate(edit ? '/app/profile' : '/app', { replace: true })
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  function back() {
    setError('')
    if (step === 0) return edit ? navigate('/app/profile') : null
    setStep([step - 1, -1])
  }

  const variants = {
    enter: (d) => ({ x: d * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d * -60, opacity: 0 }),
  }

  return (
    <div className="onb">
      <div className="onb-top">
        <motion.button className="icon-btn" onClick={back} style={{ visibility: step === 0 && !edit ? 'hidden' : 'visible' }} whileTap={{ scale: 0.88 }} aria-label="Назад"><ArrowLeft size={20} /></motion.button>
        <div className="onb-progress">
          <motion.div className="onb-progress-fill" animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.5, ease }} />
        </div>
        <span className="onb-count">{step + 1}/{steps.length}</span>
      </div>

      <div className="onb-body">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={current} className="onb-step" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.38, ease }}>
            {current === 'role' && (
              <>
                <h1>Кто ты в этой истории?</h1>
                <p className="onb-sub">От этого зависит анкета и кого ты будешь видеть в карточках</p>
                <div className="role-grid">
                  <RoleCard active={form.role === 'm'} onClick={() => set({ role: 'm' })} emoji="🕺" title="Я парень" text="Ищу богатую. Готов к яхтам, ужинам и шпицам." />
                  <RoleCard active={form.role === 'f'} onClick={() => set({ role: 'f' })} emoji="👑" title="Я девушка" text="У меня есть всё. Осталось найти, кому это отдать." />
                </div>
              </>
            )}

            {current === 'basics' && (
              <>
                <h1>{form.role === 'f' ? 'Знакомимся, королева' : 'Давай знакомиться'}</h1>
                <p className="onb-sub">Это увидят в твоей карточке</p>
                <div className="form-stack">
                  <label className="field"><span>Имя</span><input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Как тебя зовут" maxLength={40} autoFocus /></label>
                  <div className="form-row">
                    <label className="field"><span>Возраст</span><input className="input" type="number" inputMode="numeric" value={form.age} onChange={(e) => set({ age: e.target.value })} placeholder="18+" /></label>
                    <label className="field"><span>Город</span><input className="input" value={form.city} onChange={(e) => set({ city: e.target.value })} placeholder="Москва" maxLength={60} /></label>
                  </div>
                </div>
              </>
            )}

            {current === 'photos' && (
              <>
                <h1>Фотографии</h1>
                <p className="onb-sub">{form.role === 'f' ? 'Можно с яхты. Особенно с яхты.' : 'Необязательно, но с фото мэтчей сильно больше'}</p>
                <PhotoPicker value={form.photos} onChange={(photos) => set({ photos })} />
              </>
            )}

            {current === 'about' && (
              <>
                <h1>О себе</h1>
                <p className="onb-sub">{form.role === 'f' ? 'Кого ищешь и что любишь' : 'Пара строк, чтобы зацепить'}</p>
                <div className="form-stack">
                  <label className="field">
                    <span>Описание</span>
                    <textarea className="input" value={form.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={500}
                      placeholder={form.role === 'f' ? 'Ищу того, кто будет напоминать мне пить воду…' : 'Умею красиво молчать на ужинах…'} />
                  </label>
                  {form.role === 'm' && (
                    <div className="field">
                      <span>Что умеешь (по желанию)</span>
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
                </div>
              </>
            )}

            {current === 'wealth' && (
              <>
                <h1>Состояние</h1>
                <p className="onb-sub">Главное поле анкеты. Можно немного приукрасить, мы не налоговая</p>
                <div className="worth-box">
                  <Gem size={22} className="worth-gem" />
                  <motion.div key={form.netWorth} className="worth-value gold-text" initial={{ y: 8, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
                    {money(form.netWorth)}
                  </motion.div>
                  <input type="range" min={0} max={100} step={1} className="worth-range" value={toSlider(form.netWorth)}
                    onChange={(e) => set({ netWorth: toWorth(Number(e.target.value)) })}
                    style={{ '--p': `${toSlider(form.netWorth)}%` }} />
                  <div className="chips" style={{ justifyContent: 'center' }}>
                    {WORTH_PRESETS.map((w) => (
                      <motion.button type="button" key={w} whileTap={{ scale: 0.92 }} className={`chip ${form.netWorth === w ? 'on' : ''}`} onClick={() => set({ netWorth: w })}>{money(w)}</motion.button>
                    ))}
                  </div>
                </div>
                <label className="field" style={{ marginTop: 22 }}>
                  <span>Откуда деньги</span>
                  <div className="input-wrap"><Briefcase size={18} /><input className="input" value={form.incomeSource} onChange={(e) => set({ incomeSource: e.target.value })} placeholder="Нефть, IT, наследство…" maxLength={80} /></div>
                </label>
              </>
            )}

            {current === 'assets' && (
              <>
                <h1>Активы</h1>
                <p className="onb-sub">Покажи парням, ради чего стоит свайпать</p>
                <div className="form-stack">
                  <label className="field"><span>Основная машина</span><div className="input-wrap"><Car size={18} /><input className="input" value={form.mainCar} onChange={(e) => set({ mainCar: e.target.value })} placeholder="Rolls-Royce Cullinan" maxLength={80} /></div></label>
                  <div className="field"><span><Building2 size={13} style={{ verticalAlign: '-2px' }} /> Владелица компаний</span><TagInput value={form.companies} onChange={(companies) => set({ companies })} placeholder="Название и Enter" /></div>
                  <label className="field"><span>Недвижимость</span><div className="input-wrap"><Home size={18} /><input className="input" value={form.realty} onChange={(e) => set({ realty: e.target.value })} placeholder="Пентхаус, вилла в Ницце…" maxLength={120} /></div></label>
                  <label className="field"><span>Яхта</span><div className="input-wrap"><Sailboat size={18} /><input className="input" value={form.yacht} onChange={(e) => set({ yacht: e.target.value })} placeholder="42 м, зовут «Котик»" maxLength={80} /></div></label>
                  <div className="field">
                    <span><Wallet size={13} style={{ verticalAlign: '-2px' }} /> Готова тратить на парня в месяц</span>
                    <div className="chips">
                      {ALLOWANCE.map((a) => (
                        <motion.button type="button" key={a} whileTap={{ scale: 0.92 }} className={`chip ${form.allowance === a ? 'on' : ''}`} onClick={() => set({ allowance: a })}>{money(a)}</motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="onb-bottom">
        <AnimatePresence>
          {error && <motion.div className="error-text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.div>}
        </AnimatePresence>
        <motion.button className="btn btn-gold btn-block" onClick={next} disabled={busy} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}>
          {busy ? <span className="spinner" style={{ width: 20, height: 20, borderTopColor: '#2a1a06' }} />
            : last ? (edit ? 'Сохранить' : <><Crown size={18} /> Готово, показывай</>)
            : current === 'photos' && !form.photos.length ? 'Пропустить' : 'Дальше'}
        </motion.button>
      </div>
    </div>
  )
}

function RoleCard({ active, onClick, emoji, title, text }) {
  return (
    <motion.button type="button" className={`role-card ${active ? 'on' : ''}`} onClick={onClick} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}>
      <motion.span className="role-emoji" animate={active ? { scale: [1, 1.18, 1], rotate: [0, -8, 0] } : {}} transition={{ duration: 0.5 }}>{emoji}</motion.span>
      <strong>{title}</strong>
      <span>{text}</span>
      <span className="role-check">{active && <motion.span layoutId="role-dot" className="role-dot" />}</span>
    </motion.button>
  )
}
