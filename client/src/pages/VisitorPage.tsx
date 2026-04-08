import { useState, useEffect } from 'react'
import type { Page } from '../App'
import s from './VisitorPage.module.css'
import BideyetiLogo from '../components/BideyetiLogo'
import { FILTER_TABS, type Faculty } from '../data/faculties'
import { ETABLISSEMENT_DOMAIN_CONFIG } from '../data/etablissementDomains'
import { etablissementApi } from '../api/etablissementApi'
import { specialiteApi } from '../api/specialiteApi'
import { mergeEtablissementsWithSpecialites } from '../utils/etablissementList'
import DomainEtablissementSection from '../components/DomainEtablissementSection'

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

export default function VisitorPage({ nav, openDomainExplore }: Props) {
  const [search, setSearch] = useState('')
  const [domainSections, setDomainSections] = useState<DomainSectionState[]>(() =>
    ETABLISSEMENT_DOMAIN_CONFIG.map(cfg => ({
      label: cfg.label,
      queries: cfg.searchQueries,
      faculties: [],
      loading: true,
      error: false,
    }))
  )

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

      const loaded = await Promise.all(
        ETABLISSEMENT_DOMAIN_CONFIG.map(async cfg => {
          try {
            const etabs = await etablissementApi.searchByQueriesMerged(
              cfg.searchQueries
            )
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

  return (
    <div className={s.page}>
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
          <button type="button" className={s.btnHdr} onClick={() => nav('form')}>
            Se connecter
          </button>
          <button
            type="button"
            className={s.btnHdrOrange}
            onClick={() => nav('register')}
          >
            S'inscrire
          </button>
        </div>
      </header>

      <main className={s.main}>
        <h1 className={s.title}>Explorer nos Facultés</h1>

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
            Explorer par région
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
            Explorer par spécialité
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
              placeholder="Rechercher une faculté..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Rechercher une faculté"
            />
          </div>

          <div className={s.filterRow}>
            {FILTER_TABS.map(tab => (
              <div key={tab} className={s.soonContainer}>
                <span className={s.soonBadge}>Bientôt</span>
                <button
                  type="button"
                  className={s.fBtn}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                >
                  {tab}
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className={s.domainIntro}>
          Parcourir par domaine — chaque bloc correspond à une recherche par mots-clés sur le
          nom de l&apos;établissement.
        </p>

        {domainSections.map(sec => (
          <DomainEtablissementSection
            key={sec.label}
            title={sec.label}
            faculties={sec.faculties}
            loading={sec.loading}
            error={sec.error}
            globalSearch={search}
            onVoirPlus={() => openDomainExplore(sec.label, sec.queries)}
            onFacultyDetails={id => nav('faculty-detail', undefined, id)}
          />
        ))}

        <div className={s.backRow}>
          <button type="button" className={s.btnBack} onClick={() => nav('home')}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="16"
              height="16"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Retour à l'accueil
          </button>
        </div>

        <footer className={s.footer}>© 2026 Bideyety | Tous droits réservés.</footer>
      </main>
    </div>
  )
}
