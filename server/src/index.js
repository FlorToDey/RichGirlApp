import express from 'express'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import compression from 'compression'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { Server } from 'socket.io'
import { db, UPLOAD_DIR, getSecret, publicUser, now } from './db.js'
import { seed } from './seed.js'
import { botLikesBack, botGreeting, botReply, delay } from './bots.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8080)
const WEB_DIST = path.resolve(process.env.WEB_DIST || path.join(here, '..', '..', 'web', 'dist'))
const SECRET = getSecret()

seed()

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.disable('x-powered-by')
app.use(compression())
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }))

const q = {
  userById: db.prepare('SELECT * FROM users WHERE id = ?'),
  userByLogin: db.prepare('SELECT * FROM users WHERE login = ?'),
  touch: db.prepare('UPDATE users SET last_seen = ? WHERE id = ?'),
  matchBetween: db.prepare('SELECT * FROM matches WHERE a = ? AND b = ?'),
  matchById: db.prepare('SELECT * FROM matches WHERE id = ?'),
  swipe: db.prepare('SELECT * FROM swipes WHERE from_id = ? AND to_id = ?'),
}

const pair = (x, y) => (x < y ? [x, y] : [y, x])
const otherId = (m, me) => (m.a === me ? m.b : m.a)

// ---------- helpers ----------

function sign(user) {
  return jwt.sign({ id: user.id }, SECRET, { expiresIn: '180d' })
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  try {
    const { id } = jwt.verify(token, SECRET)
    const user = q.userById.get(id)
    if (!user) return res.status(401).json({ error: 'Сессия устарела, войди заново' })
    q.touch.run(now(), id)
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Нужно войти' })
  }
}

function me(user) {
  return { ...publicUser(user), login: user.login, onboarded: !!(user.role && user.name) }
}

function notify(userId, { type, title, body = null, refId = null, image = null }) {
  const info = db.prepare(`INSERT INTO notifications (user_id, type, title, body, ref_id, image, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(userId, type, title, body, refId, image, now())
  const n = db.prepare('SELECT * FROM notifications WHERE id = ?').get(info.lastInsertRowid)
  io.to(`user:${userId}`).emit('notification', formatNotification(n))
}

function formatNotification(n) {
  return { id: n.id, type: n.type, title: n.title, body: n.body, refId: n.ref_id, image: n.image, createdAt: n.created_at, read: !!n.read_at }
}

function matchPayload(m, viewerId) {
  const other = q.userById.get(otherId(m, viewerId))
  const last = db.prepare('SELECT * FROM messages WHERE match_id = ? ORDER BY id DESC LIMIT 1').get(m.id)
  const unread = db.prepare('SELECT COUNT(*) AS c FROM messages WHERE match_id = ? AND sender_id != ? AND read_at IS NULL').get(m.id, viewerId).c
  return {
    id: m.id,
    createdAt: m.created_at,
    user: publicUser(other),
    lastMessage: last ? formatMessage(last) : null,
    unread,
  }
}

function formatMessage(m) {
  return { id: m.id, matchId: m.match_id, senderId: m.sender_id, text: m.text, createdAt: m.created_at, read: !!m.read_at }
}

function createMatch(x, y) {
  const [a, b] = pair(x, y)
  const existing = q.matchBetween.get(a, b)
  if (existing) return existing
  const info = db.prepare('INSERT INTO matches (a, b, created_at) VALUES (?, ?, ?)').run(a, b, now())
  return q.matchById.get(info.lastInsertRowid)
}

function sendMessage(match, senderId, text) {
  const info = db.prepare('INSERT INTO messages (match_id, sender_id, text, created_at) VALUES (?, ?, ?, ?)').run(match.id, senderId, text, now())
  const msg = formatMessage(db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid))
  const to = otherId(match, senderId)
  io.to(`user:${to}`).emit('message', msg)
  io.to(`user:${senderId}`).emit('message', msg)
  const sender = q.userById.get(senderId)
  const receiver = q.userById.get(to)
  if (receiver && !receiver.is_bot) {
    notify(to, { type: 'message', title: `${sender.name} пишет`, body: text.slice(0, 80), refId: match.id, image: JSON.parse(sender.photos)[0] || null })
  }
  return msg
}

function announceMatch(match, x, y) {
  for (const [viewer, other] of [[x, y], [y, x]]) {
    const v = q.userById.get(viewer)
    if (!v || v.is_bot) continue
    const o = q.userById.get(other)
    io.to(`user:${viewer}`).emit('match', matchPayload(match, viewer))
    notify(viewer, { type: 'match', title: 'It\'s a Match!', body: `Вы понравились друг другу с ${o.name}`, refId: match.id, image: JSON.parse(o.photos)[0] || null })
  }
}

function scheduleBotGreeting(match, bot) {
  setTimeout(() => {
    if (!q.matchById.get(match.id)) return
    sendMessage(match, bot.id, botGreeting(bot))
  }, delay(2500, 6000))
}

// bots who "noticed" a newcomer
function welcomeLikes(user) {
  const want = user.role === 'm' ? 'f' : 'm'
  const bots = db.prepare('SELECT * FROM users WHERE is_bot = 1 AND role = ? ORDER BY RANDOM() LIMIT 3').all(want)
  bots.forEach((bot, i) => {
    setTimeout(() => {
      if (!q.userById.get(user.id)) return
      db.prepare('INSERT OR IGNORE INTO swipes (from_id, to_id, action, created_at) VALUES (?, ?, ?, ?)').run(bot.id, user.id, 'like', now())
      const title = bot.role === 'f' ? 'Тебя лайкнула богатая девушка' : 'Тебя лайкнул парень'
      const body = bot.role === 'f' ? `Состояние: ${formatMoney(bot.net_worth)}. Кто это? Свайпай и узнаешь` : 'Свайпай, чтобы узнать, кто это'
      notify(user.id, { type: 'like', title, body })
    }, 8000 + i * 15000)
  })
}

function formatMoney(n) {
  if (!n) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1).replace('.0', '')} млрд`
  if (n >= 1e6) return `$${Math.round(n / 1e6)} млн`
  return `$${n.toLocaleString('ru-RU')}`
}

const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : null) || null
const int = (v, min, max) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, Math.round(n)))
}
const strList = (v, maxItems, maxLen) => (Array.isArray(v) ? v.map((s) => str(s, maxLen)).filter(Boolean).slice(0, maxItems) : [])

// ---------- auth ----------

app.post('/api/auth/register', (req, res) => {
  const login = str(req.body?.login, 32)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!login || !/^[a-zA-Z0-9_.]{3,24}$/.test(login)) return res.status(400).json({ error: 'Логин: 3–24 символа, латиница, цифры, _ и .' })
  if (login.startsWith('bot_')) return res.status(400).json({ error: 'Этот логин занят' })
  if (password.length < 4) return res.status(400).json({ error: 'Пароль хотя бы из 4 символов' })
  if (q.userByLogin.get(login)) return res.status(409).json({ error: 'Такой логин уже есть' })
  const info = db.prepare('INSERT INTO users (login, pass, created_at, last_seen) VALUES (?, ?, ?, ?)').run(login, bcrypt.hashSync(password, 10), now(), now())
  const user = q.userById.get(info.lastInsertRowid)
  res.json({ token: sign(user), user: me(user) })
})

app.post('/api/auth/login', (req, res) => {
  const login = str(req.body?.login, 32)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const user = login && q.userByLogin.get(login)
  if (!user || user.is_bot || !bcrypt.compareSync(password, user.pass)) return res.status(401).json({ error: 'Неверный логин или пароль' })
  res.json({ token: sign(user), user: me(user) })
})

// ---------- profile ----------

app.get('/api/me', auth, (req, res) => res.json(me(req.user)))

app.put('/api/me', auth, (req, res) => {
  const b = req.body || {}
  const wasOnboarded = !!(req.user.role && req.user.name)
  const role = req.user.role || (b.role === 'm' || b.role === 'f' ? b.role : null)
  if (!role) return res.status(400).json({ error: 'Выбери, кто ты' })
  const name = str(b.name, 40)
  if (!name) return res.status(400).json({ error: 'Как тебя зовут?' })
  const photos = strList(b.photos, 6, 300).filter((p) => p.startsWith('/uploads/'))
  const fields = {
    role, name,
    age: int(b.age, 18, 99),
    city: str(b.city, 60),
    bio: str(b.bio, 500),
    photos: JSON.stringify(photos),
    skills: JSON.stringify(strList(b.skills, 8, 40)),
    net_worth: null, main_car: null, cars: '[]', companies: '[]', income_source: null, realty: null, yacht: null, allowance: null,
  }
  if (role === 'f') {
    const worth = int(b.netWorth, 0, 1e13)
    if (!worth) return res.status(400).json({ error: 'Укажи состояние. Это главное поле, без него никак' })
    const cars = (Array.isArray(b.cars) ? b.cars : [])
      .map((c) => ({ name: str(c?.name, 80), main: !!c?.main }))
      .filter((c) => c.name)
      .slice(0, 12)
    if (cars.length && !cars.some((c) => c.main)) cars[0].main = true
    cars.forEach((c, i) => { if (c.main && cars.findIndex((x) => x.main) !== i) c.main = false })
    Object.assign(fields, {
      net_worth: worth,
      main_car: cars.find((c) => c.main)?.name || null,
      cars: JSON.stringify(cars),
      companies: JSON.stringify(strList(b.companies, 10, 60)),
      income_source: null,
      realty: str(b.realty, 120),
      yacht: str(b.yacht, 80),
      allowance: int(b.allowance, 0, 1e9),
    })
  }
  const sets = Object.keys(fields).map((k) => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE users SET ${sets} WHERE id = @id`).run({ ...fields, id: req.user.id })
  const user = q.userById.get(req.user.id)
  if (!wasOnboarded) {
    notify(user.id, {
      type: 'system',
      title: role === 'm' ? 'Добро пожаловать в GoldDigg' : 'Добро пожаловать, королева',
      body: role === 'm' ? 'Свайпай вправо тех, у кого яхта побольше' : 'Парни уже выстраиваются в очередь',
    })
    welcomeLikes(user)
  }
  res.json(me(user))
})

app.delete('/api/me', auth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id)
  res.json({ ok: true })
})

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

// sharp's prebuilt binaries need an x86-64-v2 CPU; on older VPS CPUs we store the original image instead
const sharp = await import('sharp').then((m) => m.default).catch((e) => {
  console.warn('sharp unavailable, photos will be stored without resizing:', e.message.split('\n')[0])
  return null
})
const RAW_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

app.post('/api/upload', auth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Нет файла' })
  try {
    const id = `${req.user.id}_${crypto.randomBytes(8).toString('hex')}`
    let name
    if (sharp) {
      name = `${id}.webp`
      await sharp(req.file.buffer).rotate().resize(1080, 1350, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(UPLOAD_DIR, name))
    } else {
      const ext = RAW_EXT[req.file.mimetype]
      if (!ext) throw new Error('unsupported type')
      name = `${id}.${ext}`
      fs.writeFileSync(path.join(UPLOAD_DIR, name), req.file.buffer)
    }
    res.json({ url: `/uploads/${name}` })
  } catch {
    res.status(400).json({ error: 'Не получилось прочитать картинку' })
  }
})

// ---------- feed & swipes ----------

app.get('/api/feed', auth, (req, res) => {
  const u = req.user
  if (!u.role) return res.json([])
  const want = u.role === 'm' ? 'f' : 'm'
  const minWorth = want === 'f' ? int(req.query.minWorth, 0, 1e13) || 0 : 0
  const rows = db.prepare(`
    SELECT u.*, EXISTS(SELECT 1 FROM swipes s2 WHERE s2.from_id = u.id AND s2.to_id = @me AND s2.action != 'nope') AS liked_me
    FROM users u
    WHERE u.role = @want AND u.id != @me AND u.name IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.from_id = @me AND s.to_id = u.id)
      AND (@want = 'm' OR COALESCE(u.net_worth, 0) >= @minWorth)
    ORDER BY liked_me DESC, u.is_bot ASC, RANDOM()
    LIMIT 30`).all({ me: u.id, want, minWorth })
  res.json(rows.map((r) => publicUser(r)))
})

app.post('/api/feed/reset', auth, (req, res) => {
  db.prepare("DELETE FROM swipes WHERE from_id = ? AND action = 'nope'").run(req.user.id)
  res.json({ ok: true })
})

app.post('/api/swipe', auth, (req, res) => {
  const meId = req.user.id
  const targetId = int(req.body?.targetId, 1, Number.MAX_SAFE_INTEGER)
  const action = ['like', 'nope', 'super'].includes(req.body?.action) ? req.body.action : null
  const target = targetId && q.userById.get(targetId)
  if (!target || !action || target.id === meId) return res.status(400).json({ error: 'Некорректный свайп' })
  db.prepare('INSERT OR REPLACE INTO swipes (from_id, to_id, action, created_at) VALUES (?, ?, ?, ?)').run(meId, target.id, action, now())
  if (action === 'nope') return res.json({ match: null })

  const back = q.swipe.get(target.id, meId)
  let liked = back && back.action !== 'nope'
  if (!target.is_bot && !liked) {
    const label = action === 'super' ? 'Тебе прилетел супер-лайк' : 'Кто-то тебя лайкнул'
    notify(target.id, { type: 'like', title: label, body: 'Загляни в карточки, этот человек уже там' })
  }
  if (!back && target.is_bot && botLikesBack(action)) {
    db.prepare('INSERT INTO swipes (from_id, to_id, action, created_at) VALUES (?, ?, ?, ?)').run(target.id, meId, 'like', now())
    liked = true
  }
  if (!liked) return res.json({ match: null })

  const match = createMatch(meId, target.id)
  if (target.is_bot) {
    io.to(`user:${meId}`).emit('match', matchPayload(match, meId))
    scheduleBotGreeting(match, target)
  } else {
    announceMatch(match, meId, target.id)
  }
  res.json({ match: matchPayload(match, meId) })
})

app.get('/api/users/:id', auth, (req, res) => {
  const u = q.userById.get(Number(req.params.id))
  if (!u || !u.role) return res.status(404).json({ error: 'Не найдено' })
  res.json(publicUser(u))
})

// ---------- matches & messages ----------

function myMatch(req, res) {
  const m = q.matchById.get(Number(req.params.id))
  if (!m || (m.a !== req.user.id && m.b !== req.user.id)) {
    res.status(404).json({ error: 'Чат не найден' })
    return null
  }
  return m
}

app.get('/api/matches', auth, (req, res) => {
  const rows = db.prepare(`SELECT m.*, (SELECT MAX(id) FROM messages WHERE match_id = m.id) AS last_id
    FROM matches m WHERE m.a = ? OR m.b = ? ORDER BY COALESCE(last_id, 0) DESC, m.created_at DESC`).all(req.user.id, req.user.id)
  res.json(rows.map((m) => matchPayload(m, req.user.id)))
})

app.get('/api/matches/:id/messages', auth, (req, res) => {
  const m = myMatch(req, res)
  if (!m) return
  const rows = db.prepare('SELECT * FROM messages WHERE match_id = ? ORDER BY id ASC LIMIT 500').all(m.id)
  res.json(rows.map(formatMessage))
})

app.post('/api/matches/:id/messages', auth, (req, res) => {
  const m = myMatch(req, res)
  if (!m) return
  const text = str(req.body?.text, 2000)
  if (!text) return res.status(400).json({ error: 'Пустое сообщение' })
  const msg = sendMessage(m, req.user.id, text)
  const other = q.userById.get(otherId(m, req.user.id))
  if (other.is_bot) {
    setTimeout(() => {
      db.prepare('UPDATE messages SET read_at = ? WHERE match_id = ? AND sender_id = ? AND read_at IS NULL').run(now(), m.id, req.user.id)
      io.to(`user:${req.user.id}`).emit('read', { matchId: m.id })
      setTimeout(() => {
        io.to(`user:${req.user.id}`).emit('typing', { matchId: m.id })
        setTimeout(() => q.matchById.get(m.id) && sendMessage(m, other.id, botReply(other)), delay(1500, 3000))
      }, delay(500, 1500))
    }, delay(800, 2000))
  }
  res.json(msg)
})

app.post('/api/matches/:id/read', auth, (req, res) => {
  const m = myMatch(req, res)
  if (!m) return
  db.prepare('UPDATE messages SET read_at = ? WHERE match_id = ? AND sender_id != ? AND read_at IS NULL').run(now(), m.id, req.user.id)
  db.prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND type = 'message' AND ref_id = ? AND read_at IS NULL").run(now(), req.user.id, m.id)
  io.to(`user:${otherId(m, req.user.id)}`).emit('read', { matchId: m.id })
  res.json({ ok: true })
})

app.delete('/api/matches/:id', auth, (req, res) => {
  const m = myMatch(req, res)
  if (!m) return
  db.prepare('DELETE FROM matches WHERE id = ?').run(m.id)
  io.to(`user:${otherId(m, req.user.id)}`).emit('unmatch', { matchId: m.id })
  res.json({ ok: true })
})

// ---------- notifications ----------

app.get('/api/notifications', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.user.id)
  res.json(rows.map(formatNotification))
})

app.post('/api/notifications/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(now(), req.user.id)
  res.json({ ok: true })
})

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api', (req, res) => res.status(404).json({ error: 'Нет такого метода' }))

// ---------- web app ----------

if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST, { index: false, maxAge: '1h' }))
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(WEB_DIST, 'index.html')))
}

app.use((err, req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Файл слишком большой' })
  console.error(err)
  res.status(500).json({ error: 'Что-то сломалось, попробуй ещё раз' })
})

// ---------- realtime ----------

io.use((socket, next) => {
  try {
    const { id } = jwt.verify(socket.handshake.auth?.token, SECRET)
    if (!q.userById.get(id)) return next(new Error('unauthorized'))
    socket.data.userId = id
    next()
  } catch {
    next(new Error('unauthorized'))
  }
})

io.on('connection', (socket) => {
  const id = socket.data.userId
  socket.join(`user:${id}`)
  q.touch.run(now(), id)
  socket.on('typing', ({ matchId } = {}) => {
    const m = q.matchById.get(Number(matchId))
    if (!m || (m.a !== id && m.b !== id)) return
    io.to(`user:${otherId(m, id)}`).emit('typing', { matchId: m.id })
  })
})

server.listen(PORT, () => console.log(`GoldDigg is up on :${PORT}`))
