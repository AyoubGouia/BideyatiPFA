import { useEffect, useState } from 'react'
import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import type { EtablissementDetail } from '../api/etablissementApi'
import { etablissementApi } from '../api/etablissementApi'
import FacultyIconSvg from '../components/FacultyIcon'
import BideyetiLogo from '../components/BideyetiLogo'
import EducationLoader from '../components/EducationLoader'
import s from './FacultyDetailPage.module.css'

interface Props {
  nav: (
    p: Page,
    regionId?: string,
    facultyId?: string,
    specialiteId?: string
  ) => void
  facultyId?: string
}

function iconForType(type?: string | null): 'chip' | 'caduceus' | 'book' | 'gear' {
  const t = type?.toLowerCase() ?? ''
  if (t.includes('ingenieur') || t.includes('technologie')) return 'chip'
  if (t.includes('medecine')) return 'caduceus'
  if (t.includes('commerce')) return 'book'
  return 'gear'
}

export default function FacultyDetailPage({ nav, facultyId }: Props) {
  const { user } = useAuth()
  const [etab, setEtab] = useState<EtablissementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const backToList = () => nav(user ? 'university' : 'visitor')

  useEffect(() => {
    if (!facultyId) {
      setLoading(false)
      setEtab(null)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const detail = await etablissementApi.getById(facultyId)
        if (!cancelled) setEtab(detail)
      } catch {
        if (!cancelled) {
          setEtab(null)
          setError('Impossible de charger cet etablissement.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [facultyId])

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.loading}>
          <EducationLoader
            label="Chargement de l'etablissement"
            caption="Mise en place des informations, specialites et contacts."
          />
        </div>
      </div>
    )
  }

  if (!facultyId || error || !etab) {
    return (
      <div className={s.page}>
        <div className={s.error}>
          <h2>Etablissement non trouve</h2>
          <p>{error || "Cet etablissement n'existe pas ou n'est plus disponible."}</p>
          <button type="button" className={s.backBtn} onClick={backToList}>
            Retour a la liste
          </button>
        </div>
      </div>
    )
  }

  const specialites = [...(etab.specialites ?? [])].sort((a, b) =>
    a.nom.localeCompare(b.nom, 'fr')
  )
  const lieuParts = [etab.gouvernorat, etab.universite?.ville, etab.universite?.region].filter(
    Boolean
  ) as string[]
  const lieuLine = lieuParts.length > 0 ? lieuParts.join(' - ') : null

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerContent}>
          <button type="button" className={s.backBtn} onClick={backToList}>
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Retour aux facultes
          </button>

          <div className={s.logo}>
            <BideyetiLogo />
          </div>
        </div>
      </header>

      <main className={s.main}>
        <section className={s.hero}>
          <div className={s.heroContent}>
            <div className={s.icon}>
              <FacultyIconSvg icon={iconForType(etab.type)} />
            </div>
            <div className={s.heroText}>
              <h1 className={s.title}>{etab.nom}</h1>
              {etab.type && <p className={s.subtitle}>{etab.type}</p>}
              {etab.universite?.nom && (
                <span className={s.category}>{etab.universite.nom}</span>
              )}
            </div>
          </div>
        </section>

        <div className={s.infoGrid}>
          {lieuLine && (
            <section className={s.infoCard}>
              <h3>Localisation</h3>
              <p>{lieuLine}</p>
              {typeof etab.lat === 'number' && typeof etab.lon === 'number' && (
                <p className={s.coords}>
                  Coordonnees : {etab.lat.toFixed(4)}, {etab.lon.toFixed(4)}
                </p>
              )}
            </section>
          )}

          <section className={s.infoCard}>
            <h3>Identifiants</h3>
            <p>Code : {etab.code}</p>
            {etab.nomAr && <p className={s.nomAr}>Nom arabe : {etab.nomAr}</p>}
          </section>

          {etab.website && (
            <section className={s.infoCard}>
              <h3>Site web</h3>
              <a
                href={etab.website}
                target="_blank"
                rel="noopener noreferrer"
                className={s.websiteLink}
              >
                {etab.website}
              </a>
            </section>
          )}
        </div>

        <section className={s.programs}>
          <h2>Specialites</h2>
          {specialites.length === 0 ? (
            <p className={s.emptySpecialites}>
              Aucune specialite n'est rattachee a cet etablissement.
            </p>
          ) : (
            <div className={s.specialiteList}>
              {specialites.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  className={s.specialiteBtn}
                  onClick={() =>
                    nav('specialite-detail', undefined, facultyId, sp.id)
                  }
                >
                  <span className={s.specialiteNom}>{sp.nom}</span>
                  {sp.domaine && <span className={s.specialiteMeta}>{sp.domaine}</span>}
                  <span className={s.specialiteCode}>{sp.codeOrientation}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={s.actions}>
          <button type="button" className={s.compareBtn} onClick={backToList}>
            Retour a l'exploration
          </button>
        </section>
      </main>

      <footer className={s.footer}>
        <p>(c) 2026 Bideyety | Tous droits reserves.</p>
      </footer>
    </div>
  )
}
