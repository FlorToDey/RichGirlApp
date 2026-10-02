import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Navigate, Route, Routes, useLocation, useMatch } from 'react-router-dom'
import { Flame, MessageCircle, User } from 'lucide-react'
import { useSession } from '../session.jsx'
import { useDesktop } from '../hooks.js'
import Logo from '../components/Logo.jsx'
import Avatar from '../components/Avatar.jsx'
import Deck from '../components/Deck.jsx'
import ChatList from '../components/ChatList.jsx'
import Chat, { ChatPlaceholder } from '../components/Chat.jsx'
import Profile from '../components/Profile.jsx'
import Notifications from '../components/Notifications.jsx'
import MatchOverlay from '../components/MatchOverlay.jsx'
import Toast from '../components/Toast.jsx'
import './app.css'

const ease = [0.22, 1, 0.36, 1]

export default function AppShell() {
  const desktop = useDesktop()
  return (
    <>
      {desktop ? <DesktopLayout /> : <MobileLayout />}
      <MatchOverlay />
      <Toast />
    </>
  )
}

function useUnread() {
  const { matches } = useSession()
  return matches.reduce((s, m) => s + (m.unread ? 1 : 0), 0)
}

function DesktopLayout() {
  const { user } = useSession()
  const location = useLocation()
  const unread = useUnread()
  const section = location.pathname.startsWith('/app/chats') ? 'chats' : location.pathname.startsWith('/app/profile') ? 'profile' : 'cards'
  const titles = { cards: user.role === 'm' ? 'Богатые рядом' : 'Парни рядом', chats: 'Сообщения', profile: 'Профиль' }

  return (
    <div className="desk">
      <aside className="side">
        <div className="side-top">
          <NavLink to="/app/profile" className="side-me">
            <Avatar user={user} size={40} />
            <span>{user.name}</span>
          </NavLink>
          <Logo small />
        </div>
        <nav className="side-tabs">
          {[['/app', 'Карточки', Flame, true], ['/app/chats', 'Чаты', MessageCircle]].map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `side-tab ${isActive ? 'on' : ''}`}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="side-pill" className="side-pill" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                  <Icon size={17} /> <span>{label}</span>
                  {to === '/app/chats' && unread > 0 && <span className="tab-badge">{unread}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <ChatList />
      </aside>

      <main className="desk-main">
        <header className="desk-head">
          <AnimatePresence mode="wait">
            <motion.h1 key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>{titles[section]}</motion.h1>
          </AnimatePresence>
          <Notifications />
        </header>
        <div className="desk-body">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} className="pane" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.35, ease }}>
              <Routes location={location}>
                <Route index element={<Deck />} />
                <Route path="chats" element={<ChatPlaceholder />} />
                <Route path="chats/:id" element={<Chat />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function MobileLayout() {
  const location = useLocation()
  const inChat = useMatch('/app/chats/:id')
  const unread = useUnread()
  const tab = location.pathname.startsWith('/app/chats') ? 1 : location.pathname.startsWith('/app/profile') ? 2 : 0

  return (
    <div className="mob">
      <AnimatePresence initial={false}>
        {!inChat && (
          <motion.header className="mob-head" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Logo small />
            <Notifications />
          </motion.header>
        )}
      </AnimatePresence>

      <div className="mob-body">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={inChat ? 'chat' : tab} className="pane"
            initial={inChat ? { x: '100%' } : { opacity: 0, y: 12 }}
            animate={inChat ? { x: 0 } : { opacity: 1, y: 0 }}
            exit={inChat ? { x: '100%' } : { opacity: 0 }}
            transition={inChat ? { type: 'spring', stiffness: 360, damping: 38 } : { duration: 0.28, ease }}>
            <Routes location={location}>
              <Route index element={<Deck />} />
              <Route path="chats" element={<ChatList />} />
              <Route path="chats/:id" element={<Chat />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {!inChat && (
          <motion.nav className="tabbar" initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 38 }}>
            {[['/app', Flame, 'Карточки'], ['/app/chats', MessageCircle, 'Чаты'], ['/app/profile', User, 'Профиль']].map(([to, Icon, label], i) => (
              <NavLink key={to} to={to} end={i === 0} className={`tab ${tab === i ? 'on' : ''}`}>
                <motion.span className="tab-icon" whileTap={{ scale: 0.8 }}>
                  <Icon size={25} strokeWidth={tab === i ? 2.4 : 2} />
                  {i === 1 && unread > 0 && <span className="badge">{unread}</span>}
                </motion.span>
                <span>{label}</span>
                {tab === i && <motion.span layoutId="tab-dot" className="tab-dot" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
              </NavLink>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
