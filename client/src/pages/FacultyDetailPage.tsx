import { useState, useEffect } from 'react'
import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import type { EtablissementDetail } from '../api/etablissementApi'
import { etablissementApi } from '../api/etablissementApi'
import type { SpecialiteListItem } from '../api/specialiteApi'
import { specialiteApi } from '../api/specialiteApi'
import FacultyIconSvg from '../components/FacultyIcon'
import BideyetiLogo from '../components/BideyetiLogo'
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
  if (t.includes('ingénieur') || t.includes('technologie')) return 'chip'
  if (t.includes('médecine')) return 'caduceus'
  if (t.includes('commerce')) return 'book'
  return 'gear'
}

async function loadSpecialitesForEtab(
  etablissementId: string,
  universiteId: string
): Promise<SpecialiteListItem[]> {
  const [byEtab, byUni] = await Promise.all([
    specialiteApi.searchAll({ etablissementId }),
    specialiteApi.searchAll({ universiteId }),
  ])
  const map = new Map<string, SpecialiteListItem>()
  for (const sp of byEtab) map.set(sp.id, sp)
  for (const sp of byUni) map.set(sp.id, sp)
  return [...map.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export default function FacultyDetailPage({ nav, facultyId }: Props) {
  const { user } = useAuth()
  const [etab, setEtab] = useState<EtablissementDetail | null>(null)
  const [specialites, setSpecialites] = useState<SpecialiteListItem[]>([])
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
        if (cancelled) return
        setEtab(detail)
        const specs = await loadSpecialitesForEtab(detail.id, detail.universiteId)
        if (!cancelled) setSpecialites(specs)
      } catch {
        if (!cancelled) {
          setEtab(null)
          setSpecialites([])
          setError('Impossible de charger cet établissement.')
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
          <div className={s.spinner} />
          <p>Chargement des informations...</p>
        </div>
      </div>
    )
  }

  if (!facultyId || error || !etab) {
    return (
      <div className={s.page}>
        <div className={s.error}>
          <h2>Établissement non trouvé</h2>
          <p>
            {error ||
              "Cet établissement n'existe pas ou n'est plus disponible."}
          </p>
          <button type="button" className={s.backBtn} onClick={backToList}>
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  const lieuParts = [etab.gouvernorat, etab.universite?.ville, etab.universite?.region].filter(
    Boolean
  ) as string[]
  const lieuLine = lieuParts.length > 0 ? lieuParts.join(' · ') : null

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
            Retour aux facultés
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

        <section className={s.description}>
          <h2>Présentation</h2>
          <p className={s.mutedBlock}>
            Aucune description fournie par la base pour cet établissement. Les informations
            ci-dessous proviennent des données officielles enregistrées.
          </p>
        </section>

        <div className={s.infoGrid}>
          {lieuLine && (
            <section className={s.infoCard}>
              <h3>Localisation</h3>
              <p>{lieuLine}</p>
              {typeof etab.lat === 'number' && typeof etab.lon === 'number' && (
                <p className={s.coords}>
                  Coordonnées : {etab.lat.toFixed(4)}, {etab.lon.toFixed(4)}
                </p>
              )}
            </section>
          )}

          <section className={s.infoCard}>
            <h3>Identifiants</h3>
            <p>Code : {etab.code}</p>
            {etab.nomAr && <p className={s.nomAr}>Nom (arabe) : {etab.nomAr}</p>}
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
          <h2>Spécialités / programmes</h2>
          {specialites.length === 0 ? (
            <p className={s.emptySpecialites}>
              Aucune spécialité n’est rattachée à cet établissement dans les données disponibles.
            </p>
          ) : (
            <div className={s.specialiteList}>
              {specialites.map(sp => (
                <button
                  key={sp.id}
                  type="button"
                  className={s.specialiteBtn}
                  onClick={() =>
                    nav('specialite-detail', undefined, facultyId, sp.id)
                  }
                >
                  <span className={s.specialiteNom}>{sp.nom}</span>
                  {sp.domaine && (
                    <span className={s.specialiteMeta}>{sp.domaine}</span>
                  )}
                  <span className={s.specialiteCode}>{sp.codeOrientation}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={s.actions}>
          <button type="button" className={s.compareBtn} onClick={backToList}>
            Retour à l’exploration
          </button>
        </section>
      </main>

      <footer className={s.footer}>
        <p>© 2026 Bideyety | Tous droits réservés.</p>
      </footer>
    </div>
  )
}
