import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Lock, User } from 'lucide-react'
import { useSession } from '../session.jsx'
import { IS_NATIVE } from '../api.js'
import Logo from '../components/Logo.jsx'
import './auth.css'

const ease = [0.22, 1, 0.36, 1]

export default function Auth() {
  const [params, setParams] = useSearchParams()
  const mode = params.get('mode') === 'login' ? 'login' : 'register'
  const { auth } = useSession()
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const switchMode = (m) => { setError(''); setParams({ mode: m }, { replace: true }) }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const u = await auth(mode, login.trim(), password)
      navigate(u.onboarded ? '/app' : '/onboarding', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-glow" />
      {!IS_NATIVE && (
        <Link to="/" className="auth-back"><ArrowLeft size={18} /> На главную</Link>
      )}
      <motion.div className="auth-box" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
        <div className="auth-brand">
          <motion.img src="/icon.svg" alt="" className="auth-icon" initial={{ scale: 0.7, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.7, ease }} />
          <Logo />
          <p>{IS_NATIVE ? 'Найди ту, у которой есть всё. Кроме тебя.' : mode === 'register' ? 'Минута — и ты в игре' : 'С возвращением'}</p>
        </div>

        <div className="seg">
          {[['register', 'Регистрация'], ['login', 'Вход']].map(([m, label]) => (
            <button key={m} type="button" className={mode === m ? 'on' : ''} onClick={() => switchMode(m)}>
              {mode === m && <motion.span layoutId="seg-pill" className="seg-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span>Логин</span>
            <div className="input-wrap">
              <User size={18} />
              <input className="input" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="например, future_rich" autoComplete="username" autoCapitalize="none" spellCheck={false} />
            </div>
          </label>
          <label className="field">
            <span>Пароль</span>
            <div className="input-wrap">
              <Lock size={18} />
              <input className="input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="минимум 4 символа" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label="Показать пароль">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          <AnimatePresence>
            {error && (
              <motion.div className="error-text" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>{error}</motion.div>
            )}
          </AnimatePresence>
          <motion.button className="btn btn-gold btn-block" disabled={busy || !login || !password} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.015 }}>
            {busy ? <span className="spinner" style={{ width: 20, height: 20, borderTopColor: '#2a1a06' }} /> : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
          </motion.button>
        </form>
        <p className="auth-foot">
          {mode === 'register' ? 'Уже есть аккаунт? ' : 'Ещё нет аккаунта? '}
          <button type="button" onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Войти' : 'Зарегистрироваться'}</button>
        </p>
      </motion.div>
    </div>
  )
}
