import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Star, X } from 'lucide-react'
import { suggest } from '../data.js'
import './fields.css'

const ease = [0.22, 1, 0.36, 1]

function Highlight({ text, query }) {
  const i = text.toLowerCase().indexOf(query.trim().toLowerCase())
  if (!query.trim() || i < 0) return text
  const n = query.trim().length
  return <>{text.slice(0, i)}<b>{text.slice(i, i + n)}</b>{text.slice(i + n)}</>
}

// Text input with a custom suggestion dropdown
export function AutoInput({ value, onChange, options = [], placeholder, icon: Icon, autoFocus, onEnter, maxLength = 80, right }) {
  const [focused, setFocused] = useState(false)
  const [hi, setHi] = useState(0)
  const items = focused ? suggest(options, value || '') : []
  const open = items.length > 0
  const listId = useId()

  useEffect(() => setHi(0), [value])

  const pick = (v) => { onChange(v); setFocused(false) }
  const onKey = (e) => {
    if (open && e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => (h + 1) % items.length) }
    else if (open && e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => (h - 1 + items.length) % items.length) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (open) pick(items[hi])
      else onEnter?.()
    } else if (e.key === 'Escape') setFocused(false)
  }

  return (
    <div className={`ac ${open ? 'ac-open' : ''}`}>
      <div className="ac-field">
        {Icon && <Icon size={18} className="ac-icon" />}
        <input className="input" value={value || ''} placeholder={placeholder} maxLength={maxLength} autoFocus={autoFocus}
          style={{ paddingLeft: Icon ? 48 : 18, paddingRight: right ? 64 : 18 }}
          onChange={(e) => { onChange(e.target.value); setFocused(true) }}
          onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 120)} onKeyDown={onKey}
          role="combobox" aria-expanded={open} aria-controls={listId} autoComplete="off" spellCheck={false} />
        {right && <div className="ac-right">{right}</div>}
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul id={listId} className="ac-list" role="listbox" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.18, ease }}>
            {items.map((it, i) => (
              <motion.li key={it} role="option" aria-selected={i === hi} className={i === hi ? 'on' : ''}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                onPointerDown={(e) => { e.preventDefault(); pick(it) }} onMouseEnter={() => setHi(i)}>
                <Highlight text={it} query={value || ''} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function AddButton({ children, onClick }) {
  return (
    <motion.button type="button" className="add-row" onClick={onClick} whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }}>
      <span className="add-plus"><Plus size={16} strokeWidth={2.6} /></span>{children}
    </motion.button>
  )
}

let nextId = 1
// stable keys for rows so removing one in the middle animates the right row
function useRowIds(count) {
  const ids = useRef([])
  while (ids.current.length < count) ids.current.push(nextId++)
  if (ids.current.length > count) ids.current.length = count
  return {
    ids: ids.current,
    drop: (i) => { ids.current.splice(i, 1) },
  }
}

const rowAnim = {
  initial: { opacity: 0, height: 0, y: -6 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -6 },
  transition: { duration: 0.3, ease },
}

// A growing list of text fields: first one is always there, "+" adds more
export function ListField({ value, onChange, options, placeholder, addLabel = 'Добавить ещё', max = 8, icon }) {
  const rows = value.length ? value : ['']
  const [focusIdx, setFocusIdx] = useState(null)
  const { ids, drop } = useRowIds(rows.length)
  const set = (i, v) => onChange(rows.map((r, k) => (k === i ? v : r)))
  const remove = (i) => { drop(i); onChange(rows.filter((_, k) => k !== i)) }
  const add = () => { if (rows.length < max) { onChange([...rows, '']); setFocusIdx(rows.length) } }

  return (
    <div className="list-field">
      <AnimatePresence initial={false}>
        {rows.map((r, i) => (
          <motion.div key={ids[i]} className="list-row" {...rowAnim}>
            <div className="list-row-inner">
              <AutoInput value={r} onChange={(v) => set(i, v)} options={options} placeholder={placeholder} icon={icon} autoFocus={focusIdx === i}
                onEnter={() => r.trim() && i === rows.length - 1 && add()}
                right={rows.length > 1 ? <RemoveBtn onClick={() => remove(i)} /> : null} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {rows.length < max && <AddButton onClick={add}>{addLabel}</AddButton>}
    </div>
  )
}

function RemoveBtn({ onClick }) {
  return <motion.button type="button" className="row-remove" whileTap={{ scale: 0.85 }} onClick={onClick} aria-label="Убрать"><X size={15} /></motion.button>
}

export function Bookmark({ on, onClick }) {
  return (
    <motion.button type="button" className={`bookmark ${on ? 'on' : ''}`} onClick={onClick} whileTap={{ scale: 0.88 }}
      aria-label={on ? 'Основная машина' : 'Сделать основной'} title={on ? 'Основная' : 'Сделать основной'}>
      <motion.span className="bookmark-body" initial={false} animate={on ? { y: [-10, 0], scaleY: [0.7, 1] } : { y: 0, scaleY: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 18 }}>
        <Star size={15} strokeWidth={2.4} fill={on ? '#141016' : 'none'} />
      </motion.span>
    </motion.button>
  )
}

// Garage: list of cars, exactly one is marked as main with the gold bookmark
export function CarsField({ value, onChange, options, max = 10 }) {
  const rows = value.length ? value : [{ name: '', main: true }]
  const [focusIdx, setFocusIdx] = useState(null)
  const { ids, drop } = useRowIds(rows.length)
  const update = (list) => {
    if (!list.some((c) => c.main) && list.length) list = list.map((c, k) => ({ ...c, main: k === 0 }))
    onChange(list)
  }
  const add = () => { if (rows.length < max) { update([...rows, { name: '', main: false }]); setFocusIdx(rows.length) } }

  return (
    <div className="list-field">
      <AnimatePresence initial={false}>
        {rows.map((c, i) => (
          <motion.div key={ids[i]} className="list-row" {...rowAnim}>
            <div className="car-row">
              <AutoInput value={c.name} options={options} placeholder={i === 0 ? 'Например, Rolls-Royce Cullinan' : 'Ещё одна машина'} autoFocus={focusIdx === i}
                onChange={(v) => update(rows.map((r, k) => (k === i ? { ...r, name: v } : r)))}
                onEnter={() => c.name.trim() && i === rows.length - 1 && add()}
                right={rows.length > 1 ? <RemoveBtn onClick={() => { drop(i); update(rows.filter((_, k) => k !== i)) }} /> : null} />
              <Bookmark on={c.main} onClick={() => update(rows.map((r, k) => ({ ...r, main: k === i })))} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="list-foot">
        {rows.length < max && <AddButton onClick={add}>Добавить машину</AddButton>}
        <span className="hint"><span className="hint-mark"><Star size={10} fill="#141016" /></span> основная</span>
      </div>
    </div>
  )
}

// Optional thing: just a "+" until you need it
export function OptionalField({ label, addLabel, value, onChange, options, placeholder, icon }) {
  const [open, setOpen] = useState(!!value)
  return (
    <div className="opt-field">
      <span className="opt-label">{label}</span>
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div key="f" {...rowAnim}>
            <AutoInput value={value} onChange={onChange} options={options} placeholder={placeholder} icon={icon} autoFocus={!value}
              right={<RemoveBtn onClick={() => { onChange(''); setOpen(false) }} />} />
          </motion.div>
        ) : (
          <motion.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AddButton onClick={() => setOpen(true)}>{addLabel}</AddButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Horizontal snapping age picker — no native number input
export function AgeWheel({ value, onChange, min = 18, max = 70 }) {
  const ref = useRef(null)
  const [scroll, setScroll] = useState(0)
  const ITEM = 64
  const ages = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const settle = useRef(null)
  const drag = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    el.scrollLeft = ((value || 25) - min) * ITEM
    setScroll(el.scrollLeft)
    if (!value) onChange(25)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onScroll = () => {
    const el = ref.current
    setScroll(el.scrollLeft)
    clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      const age = Math.max(min, Math.min(max, min + Math.round(el.scrollLeft / ITEM)))
      if (age !== value) onChange(age)
    }, 90)
  }

  const go = (age) => ref.current.scrollTo({ left: (age - min) * ITEM, behavior: 'smooth' })

  // wheel and mouse-drag support for desktop
  const onWheel = (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { ref.current.scrollLeft += e.deltaY } }
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return
    drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false }
    ref.current.classList.add('dragging')
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    if (Math.abs(dx) > 3) drag.current.moved = true
    ref.current.scrollLeft = drag.current.left - dx
  }
  const endDrag = () => {
    if (!drag.current) return
    ref.current.classList.remove('dragging')
    go(min + Math.round(ref.current.scrollLeft / ITEM))
    setTimeout(() => { drag.current = null }, 0)
  }

  return (
    <div className="age-wheel" onKeyDown={(e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.min(max, (value || 25) + 1)) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.max(min, (value || 25) - 1)) }
    }} tabIndex={0} role="slider" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-label="Возраст">
      <div className="age-lens" />
      <div className="age-track" ref={ref} onScroll={onScroll} onWheel={onWheel}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
        <div style={{ flex: `0 0 calc(50% - ${ITEM / 2}px)` }} />
        {ages.map((a, i) => {
          const d = Math.abs(i * ITEM - scroll) / ITEM
          const k = Math.max(0, 1 - d * 0.28)
          return (
            <button type="button" key={a} className={`age-item ${a === value ? 'on' : ''}`}
              style={{ transform: `scale(${0.6 + 0.4 * k})`, opacity: Math.max(0.15, k) }}
              onClick={() => { if (!drag.current?.moved) go(a) }}>{a}</button>
          )
        })}
        <div style={{ flex: `0 0 calc(50% - ${ITEM / 2}px)` }} />
      </div>
    </div>
  )
}
