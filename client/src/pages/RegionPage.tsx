import { useState } from 'react'
import type { Page } from '../App'
import type { Region, Faculty } from '../data/faculties'
import { REGIONS, FACULTIES } from '../data/faculties'
import BideyetiLogo from '../components/BideyetiLogo'
import FacultyIconSvg from '../components/FacultyIcon'
import s from './RegionPage.module.css'

interface Props {
  nav: (p: Page, regionId?: string, facultyId?: string) => void
}

export default function RegionPage({ nav }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [search, setSearch] = useState('')

  const filteredRegions = REGIONS.filter(region =>
    region.name.toLowerCase().includes(search.toLowerCase()) ||
    region.cities.some(city => city.toLowerCase().includes(search.toLowerCase()))
  )

  const getFacultiesByRegion = (regionId: string): Faculty[] => {
    const region = REGIONS.find(r => r.id === regionId)
    if (!region) return []
    return FACULTIES.filter(faculty => region.faculties.includes(faculty.id))
  }

  const handleRegionClick = (region: Region) => {
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
            {selectedRegion ? 'Retour aux régions' : 'Retour aux facultés'}
          </button>
          
          <div className={s.logo}>
            <BideyetiLogo />
          </div>
        </div>
      </header>

      <main className={s.main}>
        {!selectedRegion ? (
          // Vue des régions
          <>
            <section className={s.hero}>
              <h1 className={s.title}>Explorer par Région</h1>
              <p className={s.subtitle}>Découvrez les facultés et universités par localisation géographique</p>
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
                  placeholder="Rechercher une région ou une ville..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Rechercher une région"
                />
              </div>
            </section>

            <section className={s.regionsGrid}>
              {filteredRegions.map(region => (
                <div key={region.id} className={s.regionCard} onClick={() => handleRegionClick(region)}>
                  <div className={s.regionHeader}>
                    <h3 className={s.regionName}>{region.name}</h3>
                    <span className={s.facultyCount}>
                      {region.faculties.length} faculté{region.faculties.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className={s.regionDescription}>{region.description}</p>
                  <div className={s.citiesList}>
                    <span className={s.citiesLabel}>Villes:</span>
                    <div className={s.cities}>
                      {region.cities.map((city, index) => (
                        <span key={index} className={s.cityTag}>{city}</span>
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
          </>
        ) : (
          // Vue des facultés de la région sélectionnée
          <>
            <section className={s.regionHero}>
              <div className={s.regionInfo}>
                <h1 className={s.regionTitle}>{selectedRegion.name}</h1>
                <p className={s.regionSubtitle}>{selectedRegion.description}</p>
                <div className={s.regionStats}>
                  <div className={s.stat}>
                    <span className={s.statNumber}>{selectedRegion.faculties.length}</span>
                    <span className={s.statLabel}>Facultés</span>
                  </div>
                  <div className={s.stat}>
                    <span className={s.statNumber}>{selectedRegion.cities.length}</span>
                    <span className={s.statLabel}>Villes</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={s.facultiesSection}>
              <h2 className={s.sectionTitle}>Facultés disponibles</h2>
              
              {getFacultiesByRegion(selectedRegion.id).length > 0 ? (
                <div className={s.facultiesGrid}>
                  {getFacultiesByRegion(selectedRegion.id).map(faculty => (
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
                        <div className={s.detail}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span>{faculty.duration}</span>
                        </div>
                      </div>
                      <div className={s.facultyPrograms}>
                        <span className={s.programsLabel}>Programmes principaux:</span>
                        <div className={s.programsList}>
                          {faculty.programs.slice(0, 3).map((program, index) => (
                            <span key={index} className={s.programTag}>{program}</span>
                          ))}
                          {faculty.programs.length > 3 && (
                            <span className={s.morePrograms}>+{faculty.programs.length - 3}</span>
                          )}
                        </div>
                      </div>
                      <button className={s.viewDetailsBtn}>
                        Voir les détails
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
                  <h3>Aucune faculté disponible</h3>
                  <p>Cette région n'a pas encore de facultés enregistrées dans notre système.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className={s.footer}>
        <p>© 2026 Bideyety | Tous droits réservés.</p>
      </footer>
    </div>
  )
}
