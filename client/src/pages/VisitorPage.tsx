import { useState } from 'react'
import type { Page } from '../App'
import s from './VisitorPage.module.css'
import FacultyCard from '../components/FacultyCard'
import BideyetiLogo from '../components/BideyetiLogo'
import { FACULTIES, FILTER_TABS, type FilterTab } from '../data/faculties'

interface Props { 
  nav: (p: Page, regionId?: string, facultyId?: string) => void 
}

export default function VisitorPage({ nav }: Props) {
  const [search, setSearch]             = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab | null>(null)

  const filtered = FACULTIES.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = activeFilter ? f.cat === activeFilter : true
    return matchSearch && matchFilter
  })

  const toggleFilter = (tab: FilterTab) =>
    setActiveFilter(prev => prev === tab ? null : tab)

  return (
    <div className={s.page}>

      {/* ── Sticky header ── */}
      <header className={s.header}>
        {/* Logo — compact badge matching the design header exactly */}
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
          <button className={s.btnHdr} onClick={() => nav('form')}>Se connecter</button>
          <button className={s.btnHdrOrange} onClick={() => nav('register')}>S'inscrire</button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className={s.main}>
        <h1 className={s.title}>Explorer nos Facultés</h1>

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
              placeholder="Rechercher une faculté..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Rechercher une faculté"
            />
          </div>

          <div className={s.filterRow}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                className={`${s.fBtn} ${activeFilter === tab ? s.fBtnOn : ''}`}
                onClick={() => toggleFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Faculty grid */}
        <div className={s.grid}>
          {filtered.map((fac, i) => (
            <FacultyCard
              key={`${fac.name}-${i}`}
              faculty={fac}
              onDetails={() => nav('faculty-detail', fac.id)}
            />
          ))}
          {filtered.length === 0 && (
            <p className={s.empty}>Aucune faculté trouvée.</p>
          )}
        </div>

        {/* ── Retour à l'accueil ── */}
        <div className={s.backRow}>
          <button className={s.btnBack} onClick={() => nav('home')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              width="16" height="16">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Retour à l'accueil
          </button>
        </div>

        <footer className={s.footer}>
          © 2026 Bideyety | Tous droits réservés.
        </footer>
      </main>
    </div>
  )
}
