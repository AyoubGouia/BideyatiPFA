import { useEffect, useMemo, useState } from 'react'
import type { Page } from '../App'
import BideyetiLogo from '../components/BideyetiLogo'
import FacultyIconSvg from '../components/FacultyIcon'
import { etablissementApi } from '../api/etablissementApi'
import { specialiteApi } from '../api/specialiteApi'
import {
  groupEtablissementsBySpeciality,
  type SpecialityBrowseEntry,
} from '../utils/etablissementList'
import { useAuth } from '../context/AuthContext'
import EducationLoader from '../components/EducationLoader'
import s from './SpecialityPage.module.css'

interface Props {
  nav: (p: Page, regionId?: string, facultyId?: string) => void
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getSpecialityIcon(label: string) {
  const c = normalizeKey(label)
  if (c.includes('genie') || c.includes('technologie') || c.includes('informatique')) return 'gear'
  if (c.includes('sante') || c.includes('medecine')) return 'caduceus'
  if (c.includes('commerce') || c.includes('gestion') || c.includes('economie')) return 'book'
  if (c.includes('science')) return 'chart'
  if (c.includes('art') || c.includes('design')) return 'palette'
  return 'chip'
}

function buildDescription(entry: SpecialityBrowseEntry) {
  const etablissements = entry.faculties.length
  const codes = entry.codeOrientations.length
  const domainHint = entry.domaine ? ` dans ${entry.domaine}` : ''
  return `${etablissements} etablissement${etablissements > 1 ? 's' : ''} reel${etablissements > 1 ? 's' : ''} trouve${etablissements > 1 ? 's' : ''}${domainHint}, ${codes} code${codes > 1 ? 's' : ''} orientation associe${codes > 1 ? 's' : ''}.`
}

export default function SpecialityPage({ nav }: Props) {
  const { user, logout } = useAuth()
  const [selectedSpeciality, setSelectedSpeciality] = useState<SpecialityBrowseEntry | null>(null)
  const [search, setSearch] = useState('')
  const [specialities, setSpecialities] = useState<SpecialityBrowseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(false)

      try {
        const [etabs, specs] = await Promise.all([
          etablissementApi.getAll(),
          specialiteApi.getAll(),
        ])

        if (cancelled) return
        setSpecialities(groupEtablissementsBySpeciality(etabs, specs))
      } catch {
        if (!cancelled) {
          setSpecialities([])
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredSpecialities = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return specialities

    return specialities.filter((speciality) =>
      speciality.name.toLowerCase().includes(query) ||
      (speciality.domaine?.toLowerCase().includes(query) ?? false) ||
      buildDescription(speciality).toLowerCase().includes(query) ||
      speciality.faculties.some(
        (faculty) =>
          faculty.name.toLowerCase().includes(query) ||
          faculty.programs.some((program) => program.toLowerCase().includes(query))
      )
    )
  }, [search, specialities])

  const handleBack = () => {
    if (selectedSpeciality) {
      setSelectedSpeciality(null)
    } else {
      nav('visitor')
    }
  }

  const handleFacultyClick = (facultyId: string) => {
    nav('faculty-detail', undefined, facultyId)
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerContent}>
          <button className={s.backBtn} onClick={handleBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {selectedSpeciality ? 'Retour aux specialites' : 'Retour aux facultes'}
          </button>

          <div className={s.logo}>
            <BideyetiLogo />
          </div>

          <div className={s.headerBtns}>
            {user && (
              <button 
                type="button" 
                className={s.btnFav} 
                onClick={() => nav('favoris')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#F47920" stroke="#F47920">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                Favoris
              </button>
            )}
            {user && (
               <button 
                type="button" 
                className={s.btnHdr} 
                onClick={async () => { await logout(); nav('home'); }}
              >
                Se deconnecter
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={s.main}>
        {!selectedSpeciality ? (
          <>
            <section className={s.hero}>
              <h1 className={s.title}>Explorer par specialite</h1>
              <p className={s.subtitle}>Decouvrez les vraies specialites et tous les etablissements qui les proposent</p>
            </section>

            <section className={s.searchSection}>
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
                  placeholder="Rechercher une specialite ou domaine..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Rechercher une specialite"
                />
              </div>
            </section>

            {loading ? (
              <div className={s.noFaculties}>
                <EducationLoader
                  compact
                  label="Chargement des specialites"
                  caption="Organisation des specialites et des etablissements en cours."
                />
              </div>
            ) : error ? (
              <div className={s.noFaculties}>
                <h3>Chargement impossible</h3>
                <p>Les specialites n'ont pas pu etre chargees depuis l'API.</p>
              </div>
            ) : filteredSpecialities.length === 0 ? (
              <div className={s.noFaculties}>
                <h3>Aucune specialite trouvee</h3>
                <p>Aucune specialite backend ne correspond a votre recherche.</p>
              </div>
            ) : (
              <section className={s.specialitiesGrid}>
                {filteredSpecialities.map((speciality) => (
                  <div
                    key={speciality.id}
                    className={s.specialityCard}
                    onClick={() => setSelectedSpeciality(speciality)}
                  >
                    <div className={s.specialityHeader}>
                      <div className={s.specialityIcon}>
                        <FacultyIconSvg icon={getSpecialityIcon(speciality.domaine || speciality.name)} />
                      </div>
                      <div className={s.specialityInfo}>
                        <h3 className={s.specialityName}>{speciality.name}</h3>
                        {speciality.domaine && (
                          <span className={s.specialityCategory}>{speciality.domaine}</span>
                        )}
                      </div>
                    </div>
                    <p className={s.specialityDescription}>{buildDescription(speciality)}</p>
                    <div className={s.specialityFooter}>
                      <button className={s.exploreBtn}>
                        Explorer cette specialite
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        ) : (
          <>
            <section className={s.specialityHero}>
              <div className={s.specialityInfo}>
                <div className={s.specialityIconLarge}>
                  <FacultyIconSvg icon={getSpecialityIcon(selectedSpeciality.domaine || selectedSpeciality.name)} />
                </div>
                <h1 className={s.specialityTitle}>{selectedSpeciality.name}</h1>
                <p className={s.specialitySubtitle}>{buildDescription(selectedSpeciality)}</p>
                <div className={s.specialityStats}>
                  <div className={s.stat}>
                    <span className={s.statNumber}>{selectedSpeciality.faculties.length}</span>
                    <span className={s.statLabel}>Etablissements</span>
                  </div>
                  <div className={s.stat}>
                    <span className={s.statNumber}>{selectedSpeciality.codeOrientations.length}</span>
                    <span className={s.statLabel}>Codes</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={s.facultiesSection}>
              <h2 className={s.sectionTitle}>Etablissements proposant cette specialite</h2>

              {selectedSpeciality.faculties.length > 0 ? (
                <div className={s.facultiesGrid}>
                  {selectedSpeciality.faculties.map((faculty) => (
                    <div key={faculty.id} className={s.facultyCard} onClick={() => handleFacultyClick(faculty.id)}>
                      <div className={s.facultyHeader}>
                        <div className={s.facultyIcon}>
                          <FacultyIconSvg icon={faculty.icon} />
                        </div>
                        <div className={s.facultyInfo}>
                          <h3 className={s.facultyName}>{faculty.name}</h3>
                          <p className={s.facultySub}>{faculty.sub}</p>
                          <div className={s.facultyMeta}>
                            <span className={s.facultyRegion}>{faculty.region}</span>
                            <span className={s.facultyCategory}>{faculty.cat}</span>
                          </div>
                        </div>
                      </div>

                      <div className={s.facultySpecialities}>
                        <span className={s.specialitiesLabel}>Specialite retenue:</span>
                        <div className={s.specialitiesList}>
                          {faculty.programs.map((program, index) => (
                            <span key={`${program}-${index}`} className={s.specialityTag}>{program}</span>
                          ))}
                        </div>
                      </div>

                      <div className={s.facultyDetails}>
                        <div className={s.detail}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{faculty.location}</span>
                        </div>
                      </div>

                      <button className={s.viewDetailsBtn}>
                        Voir les details
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={s.noFaculties}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  <h3>Aucun etablissement disponible</h3>
                  <p>Cette specialite n'est reliee a aucun etablissement exploitable pour le moment.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className={s.footer}>
        <p>(c) 2026 Bideyety | Tous droits reserves.</p>
      </footer>
    </div>
  )
}
