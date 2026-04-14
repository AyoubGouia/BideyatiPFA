import type { Faculty } from '../data/faculties'
import FacultyIconSvg from './FacultyIcon'
import s from './FacultyCard.module.css'

interface Props {
  faculty: Faculty
  onDetails?: () => void
}

export default function FacultyCard({ faculty, onDetails }: Props) {
  return (
    <div className={s.card}>
      <div className={s.top}>
        <div className={s.info}>
          <h3 className={s.name}>{faculty.name}</h3>
          <p className={s.sub}>{faculty.sub}</p>
          <div className={s.meta}>
            <span className={s.location}>{faculty.location}</span>
          </div>
        </div>
        <div className={s.ico}>
          <FacultyIconSvg icon={faculty.icon} />
        </div>
      </div>
      <div className={s.programs}>
        <span className={s.programsLabel}>Specialites :</span>
        <div className={s.programsList}>
          {faculty.programs.length === 0 ? (
            <span className={s.programsEmpty}>Aucune specialite disponible</span>
          ) : (
            <>
              {faculty.programs.slice(0, 3).map((program, index) => (
                <span key={`${program}-${index}`} className={s.programTag}>
                  {program}
                </span>
              ))}
              {faculty.programs.length > 3 && (
                <span className={s.morePrograms}>+{faculty.programs.length - 3}</span>
              )}
            </>
          )}
        </div>
      </div>
      <button className={s.btn} onClick={onDetails}>
        Voir les details
      </button>
    </div>
  )
}
