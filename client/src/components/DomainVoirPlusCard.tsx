import s from './DomainVoirPlusCard.module.css'

interface Props {
  onClick: () => void
  disabled?: boolean
}

export default function DomainVoirPlusCard({ onClick, disabled }: Props) {
  return (
    <button
      type="button"
      className={s.card}
      onClick={onClick}
      disabled={disabled}
      aria-label="Voir plus d'établissements pour ce domaine"
    >
      <span className={s.icon} aria-hidden>→</span>
      <span className={s.label}>Voir plus</span>
      <span className={s.hint}>Tous les établissements de ce domaine</span>
    </button>
  )
}
