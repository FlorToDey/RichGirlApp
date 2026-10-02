import { media } from '../api.js'

export default function Avatar({ user, size = 44, ring, online }) {
  const photo = user?.photo || user?.photos?.[0]
  const style = { width: size, height: size }
  return (
    <span className={`av ${ring ? 'av-ring' : ''}`} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {photo
        ? <img className="avatar" src={media(photo)} alt="" style={style} draggable={false} />
        : <span className="avatar-fallback" style={{ ...style, fontSize: size * 0.4 }}>{(user?.name || '?')[0]}</span>}
      {online && <span className="av-online" style={{ width: Math.max(10, size * 0.24), height: Math.max(10, size * 0.24) }} />}
    </span>
  )
}
