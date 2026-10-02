import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Gem, ShieldCheck, Sparkles } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import './landing.css'

const ease = [0.22, 1, 0.36, 1]

const reviews = [
  { photo: '/reviews/r1.jpg', name: 'Денис, 26', now: 'Сейчас: вице-президент по настроению', text: 'Свайпнул Наталью в понедельник. В пятницу уволился. Через месяц мы купили компанию моего бывшего начальника. Он теперь у меня в подчинении.' },
  { photo: '/reviews/r2.jpg', name: 'Рустам, 31', now: 'Сейчас: Монако, по будням Лондон', text: 'Раньше я ездил на самокате. Теперь меня возят. Водителя зовут Геннадий, мы подружились.' },
  { photo: '/reviews/r3.jpg', name: 'Олег, 28', now: 'Сейчас: «работаю в холдинге»', text: 'Мама спрашивает, кем я работаю. Отвечаю: в холдинге. Технически это правда.' },
  { photo: '/reviews/r4.jpg', name: 'Влад, 24', now: 'Сейчас: яхта «Котик», каюта 3', text: 'Написал в анкете «умею красиво молчать». Оказалось, это самый дорогой навык на Лазурном берегу.' },
  { photo: '/reviews/r5.jpg', name: 'Игорь, 30', now: 'Сейчас: личный ассистент шпица', text: 'За первый месяц — три страны, две яхты и шпиц по имени Доллар. Доллар теперь главный в семье.' },
  { photo: '/reviews/r6.jpg', name: 'Сергей, 27', now: 'Сейчас: счастливо женат', text: 'Думал, это развод. А это оказался брак. Очень удачный.' },
]

const preview = [
  { img: '/landing/g4.jpg', name: 'Дарина, 29', worth: '$2,7 млрд', car: 'Bugatti Chiron' },
  { img: '/landing/g2.jpg', name: 'Виктория, 31', worth: '$1,2 млрд', car: 'Bentley Bentayga' },
  { img: '/landing/g11.jpg', name: 'Наталья, 39', worth: '$4,5 млрд', car: 'Rolls-Royce Phantom' },
]

function Intro({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1700)
    return () => clearTimeout(t)
  }, [onDone])
  const word = 'GoldDigg'.split('')
  return (
    <motion.div className="intro" exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.7, ease } }} initial={{ clipPath: 'inset(0 0 0% 0)' }}>
      <motion.img src="/icon.svg" alt="" className="intro-icon"
        initial={{ scale: 0.4, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }} />
      <div className="intro-word">
        {word.map((ch, i) => (
          <motion.span key={i} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.35 + i * 0.05, duration: 0.6, ease }}>{ch}</motion.span>
        ))}
      </div>
      <motion.div className="intro-line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 1, ease }} />
    </motion.div>
  )
}

function Reviews() {
  const [[index, dir], setState] = useState([0, 1])
  const [paused, setPaused] = useState(false)
  const go = (d) => setState(([i]) => [(i + d + reviews.length) % reviews.length, d])
  const to = (i) => setState(([cur]) => [i, i > cur ? 1 : -1])

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => go(1), 6500)
    return () => clearTimeout(t)
  }, [index, paused])

  const r = reviews[index]
  return (
    <section className="reviews" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="section-head">
        <h2>Они больше <span className="gold-text">не работают</span></h2>
        <p>Истории парней, которые однажды свайпнули вправо</p>
      </div>
      <div className="review-stage">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div key={index} className="review" custom={dir}
            variants={{ enter: (d) => ({ x: d * 160, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d * -160, opacity: 0 }) }}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.65, ease }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18}
            onDragEnd={(e, info) => { if (info.offset.x < -60 || info.velocity.x < -400) go(1); else if (info.offset.x > 60 || info.velocity.x > 400) go(-1) }}>
            <motion.div className="review-photo" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.1, ease }}>
              <img src={r.photo} alt="" draggable={false} />
            </motion.div>
            <motion.div className="review-card" initial={{ x: dir * 90, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.75, ease, delay: 0.12 }}>
              <div className="quote-mark">“</div>
              <p className="review-text">{r.text}</p>
              <div className="review-meta">
                <strong>{r.name}</strong>
                <span>{r.now}</span>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="review-nav">
        <motion.button className="round-btn" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={() => go(-1)} aria-label="Назад"><ChevronLeft size={20} /></motion.button>
        <div className="dots">
          {reviews.map((_, i) => (
            <button key={i} className={`dot ${i === index ? 'on' : ''}`} onClick={() => to(i)} aria-label={`Отзыв ${i + 1}`}>
              {i === index && <motion.span className="dot-fill" key={`${index}-${paused}`} initial={{ scaleX: 0 }} animate={{ scaleX: paused ? 0 : 1 }} transition={{ duration: paused ? 0 : 6.5, ease: 'linear' }} />}
            </button>
          ))}
        </div>
        <motion.button className="round-btn" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={() => go(1)} aria-label="Вперёд"><ChevronRight size={20} /></motion.button>
      </div>
    </section>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [intro, setIntro] = useState(() => {
    try { return !sessionStorage.getItem('gd_intro') } catch { return true }
  })
  const finishIntro = () => {
    try { sessionStorage.setItem('gd_intro', '1') } catch { /* ignore */ }
    setIntro(false)
  }
  const show = !intro
  const rise = (delay) => ({ initial: { opacity: 0, y: 24 }, animate: show ? { opacity: 1, y: 0 } : {}, transition: { duration: 0.8, ease, delay } })

  return (
    <div className="landing">
      <AnimatePresence>{intro && <Intro onDone={finishIntro} />}</AnimatePresence>
      <div className="glow glow-a" />
      <div className="glow glow-b" />

      <motion.header className="land-header" {...rise(0)}>
        <Logo />
        <Link to="/auth?mode=login" className="link-quiet">Войти</Link>
      </motion.header>

      <main className="hero">
        <motion.div className="hero-pill" {...rise(0.05)}>
          <Sparkles size={14} /> Сайт знакомств, где у неё больше
        </motion.div>
        <motion.h1 {...rise(0.12)}>
          Найди ту, у которой есть <span className="gold-text">всё</span>.<br />Кроме тебя.
        </motion.h1>
        <motion.p className="hero-sub" {...rise(0.2)}>
          Анкеты с графами «Состояние», «Основная машина» и «Владелица компаний».
          Свайпаешь вправо — дальше яхты, водители и шпицы.
        </motion.p>
        <motion.div className="hero-cta" {...rise(0.28)}>
          <motion.button className="btn btn-gold btn-big" whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/auth?mode=register')}>
            Найти свою богатую <ArrowRight size={20} />
          </motion.button>
          <span className="hero-note">Регистрация за минуту, только логин и пароль</span>
        </motion.div>

        <div className="fan">
          {preview.map((p, i) => (
            <motion.div key={p.name} className={`fan-card fan-${i}`}
              initial={{ opacity: 0, y: 60, rotate: 0 }}
              animate={show ? { opacity: 1, y: 0, rotate: [-9, 0, 9][i] } : {}}
              transition={{ duration: 1, ease, delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -12, rotate: [-6, 0, 6][i], transition: { duration: 0.35 } }}>
              <img src={p.img} alt="" draggable={false} />
              <div className="fan-info">
                <strong>{p.name}</strong>
                <span className="fan-worth"><Gem size={13} /> {p.worth}</span>
                <span className="fan-car">{p.car}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div className="stats" {...rise(0.6)}>
          <div><strong className="gold-text">$41 млрд</strong><span>суммарное состояние анкет</span></div>
          <div><strong className="gold-text">1 240</strong><span>мэтчей за неделю</span></div>
          <div><strong className="gold-text"><ShieldCheck size={22} style={{ verticalAlign: '-3px' }} /> 100%</strong><span>яхты проверены на плавучесть</span></div>
        </motion.div>
      </main>

      <Reviews />

      <section className="final-cta">
        <h2>Яхта сама себя не разделит</h2>
        <motion.button className="btn btn-gold" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/auth?mode=register')}>
          Создать анкету
        </motion.button>
      </section>

      <footer className="land-footer">
        <Logo small />
        <span>© {new Date().getFullYear()} GoldDigg. Проект-шутка, все анкеты вымышленные.</span>
      </footer>
    </div>
  )
}
