import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { api, media } from '../api.js'

export default function PhotoPicker({ value, onChange, max = 6 }) {
  const input = useRef(null)
  const [pending, setPending] = useState(0)
  const [error, setError] = useState('')

  async function pick(e) {
    const files = Array.from(e.target.files || []).slice(0, max - value.length)
    e.target.value = ''
    if (!files.length) return
    setError('')
    setPending(files.length)
    let list = value
    for (const file of files) {
      const form = new FormData()
      form.append('photo', file)
      try {
        const { url } = await api('/upload', { method: 'POST', form })
        list = [...list, url]
        onChange(list)
      } catch (err) {
        setError(err.message)
      }
      setPending((p) => p - 1)
    }
  }

  const slots = Array.from({ length: max })
  return (
    <div>
      <div className="photo-grid">
        {slots.map((_, i) => {
          const url = value[i]
          const loading = !url && i < value.length + pending
          return (
            <div key={i} className={`photo-slot ${i === 0 ? 'main' : ''}`}>
              <AnimatePresence mode="popLayout">
                {url ? (
                  <motion.div key={url} className="photo-fill" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <img src={media(url)} alt="" />
                    <motion.button type="button" className="photo-remove" whileTap={{ scale: 0.85 }} onClick={() => onChange(value.filter((v) => v !== url))} aria-label="Удалить"><X size={14} /></motion.button>
                    {i === 0 && <span className="photo-main">Главное</span>}
                  </motion.div>
                ) : loading ? (
                  <motion.div key="l" className="photo-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span className="spinner" /></motion.div>
                ) : (
                  <motion.button key="e" type="button" className="photo-empty" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => input.current?.click()}>
                    <Plus size={22} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
      {error && <div className="error-text" style={{ marginTop: 10 }}>{error}</div>}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={pick} />
    </div>
  )
}
