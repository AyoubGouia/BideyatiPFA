import { useEffect, useState } from 'react'
import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import { favorisApi, FavoriItem } from '../api/favorisApi'
import FacultyCard from '../components/FacultyCard'
import EducationLoader from '../components/EducationLoader'
import BideyetiLogo from '../components/BideyetiLogo'
import type { Faculty } from '../data/faculties'
import s from './FavorisPage.module.css'

interface Props {
  nav: (p: Page, regionId?: string, facultyId?: string) => void
}

export default function FavorisPage({ nav }: Props) {
  const { user, logout } = useAuth()
  const [favorites, setFavorites] = useState<FavoriItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      favorisApi.getAll().then((data) => {
        setFavorites(data.filter(f => f.etablissementId)) // Only showing etabs for now
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    nav('home')
  }

  const backToBrowse = () => nav(user ? 'university' : 'visitor')

  const mapToFaculty = (fav: FavoriItem): Faculty => {
    const etab = fav.etablissement
    return {
      id: etab.id,
      name: etab.nom,
      sub: etab.universite?.nom || 'Université',
      location: etab.gouvernorat || 'Tunisie',
      icon: 'star', // Placeholder since icon is removed in UI
      programs: etab.specialites?.map((s: any) => s.nom) || []
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.logoWrap} onClick={backToBrowse}>
          <BideyetiLogo />
        </div>

        <div className={s.headerBtns}>
          {user && (
            <div className={s.userBadge}>
              <span>{user.prenom || 'Etudiant'}</span>
            </div>
          )}
          <button type="button" className={s.btnHdr} onClick={handleLogout}>
            Se deconnecter
          </button>
        </div>
      </header>

      <main className={s.main}>
        <section className={s.hero}>
          <h1 className={s.title}>Mes Favoris</h1>
          <p className={s.subtitle}>Explorez votre collection personnelle d'établissements et de facultés pour votre orientation future.</p>
        </section>

        {loading ? (
          <EducationLoader compact label="Chargement de vos favoris" />
        ) : favorites.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>⭐</div>
            <h2 className={s.emptyText}>Votre liste est vide pour le moment</h2>
            <p className={s.subtitle} style={{ marginBottom: '32px' }}>Parcourez les universités pour ajouter vos premiers favoris.</p>
            <button className={s.btnBack} onClick={backToBrowse}>
              Retour à l'exploration
            </button>
          </div>
        ) : (
          <div className={s.grid}>
            {favorites.map((fav) => (
              <FacultyCard
                key={fav.id}
                faculty={mapToFaculty(fav)}
                initialFavorited={true}
                onDetails={() => nav('faculty-detail', undefined, fav.etablissementId)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className={s.footer}>(c) 2026 Bideyety | Tous droits reserves.</footer>
    </div>
  )
}
