import s from './EducationLoader.module.css'

interface Props {
  label?: string
  caption?: string
  fullScreen?: boolean
  compact?: boolean
}

export default function EducationLoader({
  label = 'Chargement en cours',
  caption,
  fullScreen = false,
  compact = false,
}: Props) {
  const className = [
    s.loader,
    fullScreen ? s.fullScreen : '',
    compact ? s.compact : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} role="status" aria-live="polite">
      <div className={s.stage} aria-hidden="true">
        <div className={s.glow} />
        <div className={s.notebook}>
          <span className={s.ring} />
          <span className={s.line} />
          <span className={s.line} />
          <span className={s.lineShort} />
        </div>
        <div className={s.pen}>
          <span className={s.penTip} />
        </div>
        <span className={s.dotOne} />
        <span className={s.dotTwo} />
        <span className={s.dotThree} />
      </div>
      <p className={s.label}>{label}</p>
      {caption && <p className={s.caption}>{caption}</p>}
    </div>
  )
}
