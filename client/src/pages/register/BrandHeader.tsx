import s from './StepLayout.module.css'

interface Props {
  step: string
  subtitle: string
}

export default function BrandHeader({ step, subtitle }: Props) {
  return (
    <>
      <div className={s.stepPill}>{step}</div>
      <div className={s.brandCard}>
        <div className={s.brandRow}>
          <span className={s.brandName}>BIDEYETY</span>
          <span className={s.brandIcon}>
            <svg viewBox="0 0 24 24" fill="none"
              stroke="#d96a10" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"
              width="20" height="20">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"
                fill="#F47920" stroke="#d96a10" strokeWidth="2"/>
            </svg>
          </span>
        </div>
        <p className={s.brandSub} style={{ whiteSpace: 'pre-line' }}>{subtitle}</p>
      </div>
    </>
  )
}
