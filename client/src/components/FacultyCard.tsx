import { useState, useEffect } from 'react'
import type { Faculty } from '../data/faculties'
import { favorisApi } from '../api/favorisApi'
import { useAuth } from '../context/AuthContext'
import s from './FacultyCard.module.css'

interface Props {
  faculty: Faculty
  onDetails?: () => void
  initialFavorited?: boolean
}

export default function FacultyCard({ faculty, onDetails, initialFavorited }: Props) {
  const { user } = useAuth()
  const [isFavorited, setIsFavorited] = useState(initialFavorited ?? false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (user && initialFavorited === undefined) {
      favorisApi.check(faculty.id, 'etablissement').then(setIsFavorited)
    }
  }, [faculty.id, user, initialFavorited])

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    try {
      const res = await favorisApi.toggle(faculty.id, 'etablissement')
      setIsFavorited(res.favorited)
    } catch (err) {
      console.error('Failed to toggle favorite', err)
    }
  }

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
        
        {user && (
          <button 
            type="button"
            className={s.starBtn} 
            onClick={toggleFavorite}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <svg 
              viewBox="0 0 24 24" 
              className={`${s.star} ${isFavorited || isHovered ? s.starFull : s.starEmpty}`}
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        )}
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
        Explorer l'établissement
      </button>
    </div>
  )
}
