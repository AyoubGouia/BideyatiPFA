import { useState, useEffect, useMemo } from 'react'
import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import type { SpecialiteDetail } from '../api/specialiteApi'
import { specialiteApi } from '../api/specialiteApi'
import {
  statistiquesAdmissionApi,
  capacitesAdmissionApi,
  type StatistiqueAdmissionRow,
  type CapaciteAdmissionRow,
} from '../api/admissionApi'
import BideyetiLogo from '../components/BideyetiLogo'
import s from './SpecialiteDetailPage.module.css'

const YEARS = [2023, 2024, 2025] as const

interface Props {
  nav: (
    p: Page,
    regionId?: string,
    facultyId?: string,
    specialiteId?: string
  ) => void
  specialiteId?: string
  facultyId?: string
}

export default function SpecialiteDetailPage({
  nav,
  specialiteId,
  facultyId,
}: Props) {
  const { user } = useAuth()
  const [year, setYear] = useState<number>(2025)
  const [specialite, setSpecialite] = useState<SpecialiteDetail | null>(null)
  const [stats, setStats] = useState<StatistiqueAdmissionRow[]>([])
  const [caps, setCaps] = useState<CapaciteAdmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!specialiteId) {
      setLoading(false)
      setSpecialite(null)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [sp, st, cp] = await Promise.all([
          specialiteApi.getById(specialiteId),
          statistiquesAdmissionApi.getBySpecialite(specialiteId),
          capacitesAdmissionApi.getBySpecialite(specialiteId),
        ])
        if (cancelled) return
        setSpecialite(sp)
        setStats(st)
        setCaps(cp)
      } catch {
        if (!cancelled) {
          setSpecialite(null)
          setError('Impossible de charger cette spécialité.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [specialiteId])

  const statsForYear = useMemo(
    () => stats.filter(r => r.annee === year),
    [stats, year]
  )

  const capsForYear = useMemo(
    () => caps.filter(r => r.annee === year),
    [caps, year]
  )

  const sortedCaps = useMemo(() => {
    return [...capsForYear].sort((a, b) => {
      const sa = a.section?.nom ?? ''
      const sb = b.section?.nom ?? ''
      if (sa !== sb) return sa.localeCompare(sb, 'fr')
      return a.tour.localeCompare(b.tour, 'fr')
    })
  }, [capsForYear])

  const backToEtablissement = () => {
    if (facultyId) nav('faculty-detail', undefined, facultyId)
    else nav(user ? 'university' : 'visitor')
  }

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p>Chargement…</p>
        </div>
      </div>
    )
  }

  if (!specialiteId || error || !specialite) {
    return (
      <div className={s.page}>
        <div className={s.error}>
          <h2>Spécialité non trouvée</h2>
          <p>{error || 'Cette spécialité est introuvable.'}</p>
          <button type="button" className={s.backBtn} onClick={backToEtablissement}>
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <button type="button" className={s.backBtn} onClick={backToEtablissement}>
            ← Retour à l&apos;établissement
          </button>
          <div className={s.logo}>
            <BideyetiLogo />
          </div>
        </div>
      </header>

      <main className={s.main}>
        <section className={s.hero}>
          <h1 className={s.title}>{specialite.nom}</h1>
          <p className={s.code}>Code orientation : {specialite.codeOrientation}</p>
          {specialite.domaine && (
            <span className={s.badge}>{specialite.domaine}</span>
          )}
          {specialite.formuleBrute && (
            <p className={s.desc}>{specialite.formuleBrute}</p>
          )}
        </section>

        <section className={s.card}>
          <h2 className={s.cardTitle}>Admission — année</h2>
          <p className={s.cardHint}>
            Sélectionnez une année pour voir le dernier admis et les capacités correspondantes.
          </p>
          <div className={s.yearRow} role="tablist" aria-label="Année">
            {YEARS.map(y => (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={year === y}
                className={`${s.yearPill} ${year === y ? s.yearPillActive : ''}`}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </section>

        <section className={s.card}>
          <h2 className={s.cardTitle}>Dernier admis ({year})</h2>
          {statsForYear.length === 0 ? (
            <p className={s.empty}>Aucune statistique d&apos;admission pour cette année.</p>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Section Bac</th>
                    <th>Dernier admis</th>
                    <th>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {statsForYear.map(row => (
                    <tr key={row.id}>
                      <td>{row.section?.nom ?? '—'}</td>
                      <td>{row.scoreDernierAdmis}</td>
                      <td>
                        {row.tauxAdmission != null
                          ? `${row.tauxAdmission}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={s.card}>
          <h2 className={s.cardTitle}>Capacités par section Bac ({year})</h2>
          {sortedCaps.length === 0 ? (
            <p className={s.empty}>Aucune capacité enregistrée pour cette année.</p>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Section Bac</th>
                    <th>Tour</th>
                    <th>Capacité</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCaps.map(row => (
                    <tr key={row.id}>
                      <td>{row.section?.nom ?? '—'}</td>
                      <td>{row.tour}</td>
                      <td>{row.capacite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className={s.footer}>
        <p>© 2026 Bideyety | Tous droits réservés.</p>
      </footer>
    </div>
  )
}
