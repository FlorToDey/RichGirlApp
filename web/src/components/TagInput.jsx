import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'

export default function TagInput({ value, onChange, placeholder, max = 10 }) {
  const [text, setText] = useState('')
  const add = () => {
    const t = text.trim()
    if (!t || value.includes(t) || value.length >= max) return
    onChange([...value, t])
    setText('')
  }
  return (
    <div className="tag-input">
      <div className="input-wrap tag-row">
        <input className="input" value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} style={{ paddingLeft: 18, paddingRight: 56 }} />
        <motion.button type="button" className="tag-add" whileTap={{ scale: 0.88 }} onClick={add} disabled={!text.trim()} aria-label="Добавить"><Plus size={18} /></motion.button>
      </div>
      {value.length > 0 && (
        <div className="chips" style={{ marginTop: 10 }}>
          <AnimatePresence>
            {value.map((t) => (
              <motion.span key={t} layout className="chip on" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                {t}
                <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} aria-label="Убрать" style={{ display: 'grid', marginRight: -4 }}><X size={14} /></button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
