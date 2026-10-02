export default function Logo({ small }) {
  return (
    <span className="logo" style={small ? { fontSize: 16 } : undefined}>
      <img src="/icon.svg" alt="" style={small ? { width: 26, height: 26, borderRadius: 8 } : undefined} />
      <span>Gold<span className="gold-text">Digg</span></span>
    </span>
  )
}
