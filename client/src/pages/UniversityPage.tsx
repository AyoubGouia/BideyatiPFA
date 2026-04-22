import { useEffect, useState } from 'react'
import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import s from './UniversityPage.module.css'
import BideyetiLogo from '../components/BideyetiLogo'
import type { Faculty } from '../data/faculties'
import { ETABLISSEMENT_DOMAIN_CONFIG } from '../data/etablissementDomains'
import { etablissementApi } from '../api/etablissementApi'
import { specialiteApi } from '../api/specialiteApi'
import { mergeEtablissementsWithSpecialites } from '../utils/etablissementList'
import DomainEtablissementSection from '../components/DomainEtablissementSection'
import FacultyCard from '../components/FacultyCard'
import EducationLoader from '../components/EducationLoader'
import UserMenu from '../components/UserMenu'

interface DomainSectionState {
  label: string
  queries: string[]
  faculties: Faculty[]
  loading: boolean
  error: boolean
}

interface Props {
  nav: (p: Page, regionId?: string, facultyId?: string) => void
  openDomainExplore: (label: string, queries: string[]) => void
}

export default function UniversityPage({ nav, openDomainExplore }: Props) {
  const { user, logout } = useAuth()
  const [search, setSearch] = useState('')
  const [allSpecialites, setAllSpecialites] = useState<
    Awaited<ReturnType<typeof specialiteApi.getAll>>
  >([])
  const [domainSections, setDomainSections] = useState<DomainSectionState[]>(() =>
    ETABLISSEMENT_DOMAIN_CONFIG.map((cfg) => ({
      label: cfg.label,
      queries: cfg.searchQueries,
      faculties: [],
      loading: true,
      error: false,
    }))
  )
  const [searchResults, setSearchResults] = useState<Faculty[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let specs: Awaited<ReturnType<typeof specialiteApi.getAll>> = []
      try {
        specs = await specialiteApi.getAll()
      } catch {
        specs = []
      }
      if (cancelled) return
      setAllSpecialites(specs)

      const loaded = await Promise.all(
        ETABLISSEMENT_DOMAIN_CONFIG.map(async (cfg) => {
          try {
            const etabs = await etablissementApi.searchByQueriesMerged(cfg.searchQueries)
            const faculties = mergeEtablissementsWithSpecialites(etabs, specs)
            return {
              label: cfg.label,
              queries: cfg.searchQueries,
              faculties,
              loading: false,
              error: false,
            }
          } catch {
            return {
              label: cfg.label,
              queries: cfg.searchQueries,
              faculties: [],
              loading: false,
              error: true,
            }
          }
        })
      )

      if (!cancelled) setDomainSections(loaded)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const query = search.trim()
    if (!query) {
      setSearchResults([])
      setSearchLoading(false)
      setSearchError(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      setSearchError(false)
      try {
        const etabs = await etablissementApi.search({ q: query })
        if (!cancelled) {
          setSearchResults(mergeEtablissementsWithSpecialites(etabs, allSpecialites))
        }
      } catch {
        if (!cancelled) {
          setSearchResults([])
          setSearchError(true)
        }
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [search, allSpecialites])

  const isSearching = search.trim() !== ''

  const handleLogout = async () => {
    await logout()
    nav('home')
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div
          className={s.logoWrap}
          onClick={() => nav('home')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && nav('home')}
          aria-label="Retour a l'accueil"
        >
          <BideyetiLogo />
        </div>

        <div className={s.headerBtns}>
          {user && (
            <button type="button" className={s.btnFav} onClick={() => nav('favoris')}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#F47920" stroke="#F47920">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              Favoris
            </button>
          )}
          <UserMenu user={user} onLogout={handleLogout} />
        </div>
      </header>

      <main className={s.main}>
        <h1 className={s.title}>Explorer les etablissements</h1>

        <div className={s.navigationOptions}>
          <button type="button" className={s.regionBtn} onClick={() => nav('region')}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="20"
              height="20"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Explorer par region
          </button>
          <div className={s.divider}>ou</div>
          <button
            type="button"
            className={s.specialityBtn}
            onClick={() => nav('speciality')}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="20"
              height="20"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Explorer par specialite
          </button>
        </div>

        <div className={s.searchRow}>
          <div className={s.searchBox}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#aab5be"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un etablissement, une specialite, une universite ou une region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher"
            />
          </div>
        </div>

        {isSearching ? (
          <>
            <p className={s.domainIntro}>
              Resultats de recherche bases sur les donnees reelles du backend.
            </p>
            {searchLoading && (
              <EducationLoader
                compact
                label="Recherche des etablissements"
                caption="Verification des correspondances en cours."
              />
            )}
            {searchError && !searchLoading && (
              <p className={s.empty}>Impossible de lancer la recherche.</p>
            )}
            {!searchLoading && !searchError && searchResults.length === 0 && (
              <p className={s.empty}>Aucun etablissement ne correspond a votre recherche.</p>
            )}
            {!searchLoading && !searchError && searchResults.length > 0 && (
              <div className={s.grid}>
                {searchResults.map((faculty) => (
                  <FacultyCard
                    key={faculty.id}
                    faculty={faculty}
                    onDetails={() => nav('faculty-detail', undefined, faculty.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className={s.domainIntro}>
              Parcourir par domaine : chaque bloc montre des etablissements reels
              trouves a partir de mots-cles et des donnees backend.
            </p>

            {domainSections.map((sec) => (
              <DomainEtablissementSection
                key={sec.label}
                title={sec.label}
                faculties={sec.faculties}
                loading={sec.loading}
                error={sec.error}
                globalSearch=""
                onVoirPlus={() => openDomainExplore(sec.label, sec.queries)}
                onFacultyDetails={(id) => nav('faculty-detail', undefined, id)}
              />
            ))}
          </>
        )}

        <footer className={s.footer}>(c) 2026 Bideyety | Tous droits reserves.</footer>
      </main>
    </div>
  )
}
