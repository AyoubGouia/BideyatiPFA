import { useEffect, useMemo, useState } from 'react'
import type { Page } from '../App'
import type { Faculty } from '../data/faculties'
import BideyetiLogo from '../components/BideyetiLogo'
import FacultyIconSvg from '../components/FacultyIcon'
import { etablissementApi } from '../api/etablissementApi'
import { specialiteApi } from '../api/specialiteApi'
import { universiteApi } from '../api/universiteApi'
import { mergeEtablissementsWithSpecialites } from '../utils/etablissementList'
import EducationLoader from '../components/EducationLoader'
import s from './RegionPage.module.css'

interface Props {
  nav: (p: Page, regionId?: string, facultyId?: string) => void
}

interface RegionGroup {
  id: string
  name: string
  description: string
  cities: string[]
  faculties: Faculty[]
}

function normalizeKey(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function regionDescription(name: string, facultiesCount: number, citiesCount: number): string {
  if (facultiesCount === 0) {
    return `Aucun etablissement backend n'est actuellement rattache a ${name}.`
  }

  const cityLabel = citiesCount > 1 ? `${citiesCount} villes universitaires` : '1 ville universitaire'
  return `${facultiesCount} etablissements reels trouves pour ${name}, repartis sur ${cityLabel}.`
}

export default function RegionPage({ nav }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<RegionGroup | null>(null)
  const [search, setSearch] = useState('')
  const [regions, setRegions] = useState<RegionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(false)

      try {
        const [etabs, specs, universites] = await Promise.all([
          etablissementApi.getAll(),
          specialiteApi.getAll().catch(() => []),
          universiteApi.getAll().catch(() => []),
        ])

        if (cancelled) return

        const universityById = new Map(universites.map((u) => [u.id, u]))
        const faculties = mergeEtablissementsWithSpecialites(etabs, specs)
        const grouped = new Map<string, RegionGroup>()

        for (const faculty of faculties) {
          const regionName = faculty.region?.trim() || 'Tunisie'
          const key = normalizeKey(regionName) || regionName.toLowerCase()
          const university = universityById.get(
            etabs.find((etab) => etab.id === faculty.id)?.universiteId ?? ''
          )

          if (!grouped.has(key)) {
            grouped.set(key, {
              id: key,
              name: regionName,
              description: '',
              cities: [],
              faculties: [],
            })
          }

          const group = grouped.get(key)!
          group.faculties.push(faculty)

          const possibleCities = [university?.ville, regionName]
            .map((value) => value?.trim())
            .filter(Boolean) as string[]

          for (const city of possibleCities) {
            if (!group.cities.includes(city)) group.cities.push(city)
          }
        }

        const nextRegions = [...grouped.values()]
          .map((region) => ({
            ...region,
            cities: [...region.cities].sort((a, b) => a.localeCompare(b, 'fr')),
            faculties: [...region.faculties].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
            description: regionDescription(
              region.name,
              region.faculties.length,
              region.cities.length
            ),
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

        setRegions(nextRegions)
      } catch {
        if (!cancelled) {
          setRegions([])
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

  const filteredRegions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return regions

    return regions.filter((region) =>
      region.name.toLowerCase().includes(query) ||
      region.cities.some((city) => city.toLowerCase().includes(query))
    )
  }, [regions, search])

  const handleRegionClick = (region: RegionGroup) => {
    setSelectedRegion(region)
  }

  const handleFacultyClick = (facultyId: string) => {
    nav('faculty-detail', undefined, facultyId)
  }

  const handleBack = () => {
    if (selectedRegion) {
      setSelectedRegion(null)
    } else {
      nav('visitor')
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerContent}>
          <button className={s.backBtn} onClick={handleBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {selectedRegion ? 'Retour aux regions' : 'Retour aux facultes'}
          </button>

          <div className={s.logo}>
            <BideyetiLogo />
          </div>
        </div>
      </header>

      <main className={s.main}>
        {!selectedRegion ? (
          <>
            <section className={s.hero}>
              <h1 className={s.title}>Explorer par region</h1>
              <p className={s.subtitle}>Decouvrez les etablissements reels par localisation geographique</p>
            </section>

            <section className={s.searchSection}>
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
                  placeholder="Rechercher une region ou une ville..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Rechercher une region"
                />
              </div>
            </section>

            {loading ? (
              <div className={s.noFaculties}>
                <EducationLoader
                  compact
                  label="Chargement des regions"
                  caption="Recuperation des etablissements et localisations reelles."
                />
              </div>
            ) : error ? (
              <div className={s.noFaculties}>
                <h3>Chargement impossible</h3>
                <p>Les regions n'ont pas pu etre chargees depuis l'API.</p>
              </div>
            ) : filteredRegions.length === 0 ? (
              <div className={s.noFaculties}>
                <h3>Aucune region trouvee</h3>
                <p>Aucun etablissement backend ne correspond a votre recherche.</p>
              </div>
            ) : (
              <section className={s.regionsGrid}>
                {filteredRegions.map(region => (
                  <div key={region.id} className={s.regionCard} onClick={() => handleRegionClick(region)}>
                    <div className={s.regionHeader}>
                      <h3 className={s.regionName}>{region.name}</h3>
                      <span className={s.facultyCount}>
                        {region.faculties.length} etablissement{region.faculties.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className={s.regionDescription}>{region.description}</p>
                    <div className={s.citiesList}>
                      <span className={s.citiesLabel}>Villes:</span>
                      <div className={s.cities}>
                        {region.cities.map((city, index) => (
                          <span key={`${city}-${index}`} className={s.cityTag}>{city}</span>
                        ))}
                      </div>
                    </div>
                    <div className={s.regionFooter}>
                      <button className={s.exploreBtn}>
                        Explorer {region.name}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <polyline points="9 18 15 12 9 6"/>
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
            <section className={s.regionHero}>
              <div className={s.regionInfo}>
                <h1 className={s.regionTitle}>{selectedRegion.name}</h1>
                <p className={s.regionSubtitle}>{selectedRegion.description}</p>
                <div className={s.regionStats}>
                  <div className={s.stat}>
                    <span className={s.statNumber}>{selectedRegion.faculties.length}</span>
                    <span className={s.statLabel}>Etablissements</span>
                  </div>
                  <div className={s.stat}>
                    <span className={s.statNumber}>{selectedRegion.cities.length}</span>
                    <span className={s.statLabel}>Villes</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={s.facultiesSection}>
              <h2 className={s.sectionTitle}>Etablissements disponibles</h2>

              {selectedRegion.faculties.length > 0 ? (
                <div className={s.facultiesGrid}>
                  {selectedRegion.faculties.map(faculty => (
                    <div key={faculty.id} className={s.facultyCard} onClick={() => handleFacultyClick(faculty.id)}>
                      <div className={s.facultyHeader}>
                        <div className={s.facultyIcon}>
                          <FacultyIconSvg icon={faculty.icon} />
                        </div>
                        <div className={s.facultyInfo}>
                          <h3 className={s.facultyName}>{faculty.name}</h3>
                          <p className={s.facultySub}>{faculty.sub}</p>
                          <span className={s.facultyCategory}>{faculty.cat}</span>
                        </div>
                      </div>
                      <div className={s.facultyDetails}>
                        <div className={s.detail}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          <span>{faculty.location}</span>
                        </div>
                      </div>
                      <div className={s.facultyPrograms}>
                        <span className={s.programsLabel}>Specialites principales:</span>
                        <div className={s.programsList}>
                          {faculty.programs.slice(0, 3).map((program, index) => (
                            <span key={`${program}-${index}`} className={s.programTag}>{program}</span>
                          ))}
                          {faculty.programs.length > 3 && (
                            <span className={s.morePrograms}>+{faculty.programs.length - 3}</span>
                          )}
                          {faculty.programs.length === 0 && (
                            <span className={s.programTag}>Aucune specialite disponible</span>
                          )}
                        </div>
                      </div>
                      <button className={s.viewDetailsBtn}>
                        Voir les details
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={s.noFaculties}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  <h3>Aucun etablissement disponible</h3>
                  <p>Cette region n'a pas encore d'etablissements disponibles dans le backend.</p>
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
