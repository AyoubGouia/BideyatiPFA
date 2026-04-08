import { useState, useEffect } from 'react'
import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import s from './UniversityPage.module.css'
import FacultyCard from '../components/FacultyCard'
import BideyetiLogo from '../components/BideyetiLogo'
import { mapEtablissementToFaculty, FILTER_TABS, type FilterTab, type Faculty } from '../data/faculties'
import { etablissementApi } from '../api/etablissementApi'

interface Props { 
  nav: (p: Page, regionId?: string, facultyId?: string) => void 
}

export default function UniversityPage({ nav }: Props) {
  const { user, logout } = useAuth()
  const [search, setSearch]             = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab | null>(null)
  const [allFaculties, setAllFaculties] = useState<Faculty[]>([])
  const [visibleCount, setVisibleCount] = useState(9)
  const [isLoading, setIsLoading]       = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await etablissementApi.getAll();
        setAllFaculties(data.map(mapEtablissementToFaculty));
      } catch (err) {
        console.error("Failed to load etablissements:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [])

  const filtered = allFaculties.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = activeFilter ? f.cat === activeFilter : true
    return matchSearch && matchFilter
  })

  const displayed = filtered.slice(0, visibleCount)

  const handleLoadMore = () => setVisibleCount(prev => prev + 9)

  const toggleFilter = (tab: FilterTab) =>
    setActiveFilter(prev => prev === tab ? null : tab)

  const handleLogout = async () => {
    await logout()
    nav('home')
  }

  return (
    <div className={s.page}>

      {/* ── Sticky header ── */}
      <header className={s.header}>
        <div
          className={s.logoWrap}
          onClick={() => nav('home')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && nav('home')}
          aria-label="Retour à l'accueil"
        >
          <BideyetiLogo />
        </div>

        <div className={s.headerBtns}>
          {user && (
            <div className={s.userBadge}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{user.prenom || 'Étudiant'}</span>
            </div>
          )}
          <button className={s.btnHdr} onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className={s.main}>
        <h1 className={s.title}>Explorer les Universités</h1>

        {/* Navigation options */}
        <div className={s.navigationOptions}>
          <button className={s.regionBtn} onClick={() => nav('region')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Explorer par région
          </button>
          <div className={s.divider}>ou</div>
          <button className={s.specialityBtn} onClick={() => nav('speciality')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Explorer par spécialité
          </button>
        </div>

        {/* Search + filter row */}
        <div className={s.searchRow}>
          <div className={s.searchBox}>
            <svg
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#aab5be"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Rechercher une université..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Rechercher une université"
            />
          </div>

          <div className={s.filterRow}>
            {FILTER_TABS.map(tab => (
              <div key={tab} className={s.soonContainer}>
                <span className={s.soonBadge}>Bientôt</span>
                <button
                  className={`${s.fBtn} ${activeFilter === tab ? s.fBtnOn : ''}`}
                  onClick={() => toggleFilter(tab)}
                  disabled // Disabled as requested for now
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                >
                  {tab}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Faculty grid */}
        <div className={s.grid}>
          {isLoading ? (
            <p className={s.empty}>Chargement des universités...</p>
          ) : (
            displayed.map((fac, i) => (
              <FacultyCard
                key={`${fac.name}-${i}`}
                faculty={fac}
                onDetails={() => nav('faculty-detail', undefined, fac.id)}
              />
            ))
          )}
          {!isLoading && displayed.length === 0 && (
            <p className={s.empty}>Aucune université trouvée.</p>
          )}
        </div>

        {/* Load More Button */}
        {!isLoading && visibleCount < filtered.length && (
          <div className={s.loadMoreRow}>
            <button className={s.btnLoadMore} onClick={handleLoadMore}>
              Charger plus d'universités
            </button>
          </div>
        )}

        <footer className={s.footer}>
          © 2026 Bideyety | Tous droits réservés.
        </footer>
      </main>
    </div>
  )
}
