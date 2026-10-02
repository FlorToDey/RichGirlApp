import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSession } from './session.jsx'
import { IS_NATIVE } from './api.js'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import Onboarding from './pages/Onboarding.jsx'
import AppShell from './pages/AppShell.jsx'

function Splash() {
  return (
    <div className="center-fill" style={{ height: '100%' }}>
      <motion.img src="/icon.svg" alt="" width={72} height={72} style={{ borderRadius: 20 }}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  )
}

function Guard({ need, children }) {
  const { user } = useSession()
  if (need === 'guest') {
    if (user?.onboarded) return <Navigate to="/app" replace />
    if (user) return <Navigate to="/onboarding" replace />
    return children
  }
  if (!user) return <Navigate to="/auth" replace />
  if (need === 'onboarding' && user.onboarded && !new URLSearchParams(window.location.search).has('edit')) return <Navigate to="/app" replace />
  if (need === 'app' && !user.onboarded) return <Navigate to="/onboarding" replace />
  return children
}

const page = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25 } },
}

export default function App() {
  const { ready } = useSession()
  const location = useLocation()
  if (!ready) return <Splash />
  const top = location.pathname.split('/')[1] || 'home'
  return (
    <AnimatePresence mode="wait">
      <motion.div key={top} {...page} style={{ height: '100%' }}>
        <Routes location={location}>
          <Route path="/" element={<Guard need="guest">{IS_NATIVE ? <Navigate to="/auth" replace /> : <Landing />}</Guard>} />
          <Route path="/auth" element={<Guard need="guest"><Auth /></Guard>} />
          <Route path="/onboarding" element={<Guard need="onboarding"><Onboarding /></Guard>} />
          <Route path="/app/*" element={<Guard need="app"><AppShell /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
