import { useState } from 'react'
import type { Page } from '../App'
import type { Speciality, Faculty } from '../data/faculties'
import { SPECIALITIES, FACULTIES } from '../data/faculties'
import BideyetiLogo from '../components/BideyetiLogo'
import FacultyIconSvg from '../components/FacultyIcon'
import s from './SpecialityPage.module.css'

interface Props {
  nav: (p: Page, specialityId?: string, facultyId?: string) => void
}

export default function SpecialityPage({ nav }: Props) {
  const [selectedSpeciality, setSelectedSpeciality] = useState<Speciality | null>(null)
  const [search, setSearch] = useState('')

  const filteredSpecialities = SPECIALITIES.filter(speciality =>
    speciality.name.toLowerCase().includes(search.toLowerCase()) ||
    speciality.category.toLowerCase().includes(search.toLowerCase()) ||
    speciality.description.toLowerCase().includes(search.toLowerCase())
  )

  const getFacultiesBySpeciality = (specialityId: string): Faculty[] => {
    const speciality = SPECIALITIES.find(s => s.id === specialityId)
    if (!speciality) return []
    return FACULTIES.filter(faculty => speciality.faculties.includes(faculty.id))
  }

  const handleSpecialityClick = (speciality: Speciality) => {
    setSelectedSpeciality(speciality)
  }

  const handleFacultyClick = (facultyId: string) => {
    nav('faculty-detail', undefined, facultyId)
  }

  const handleBack = () => {
    if (selectedSpeciality) {
      setSelectedSpeciality(null)
    } else {
      nav('visitor')
    }
  }

  const getSpecialityIcon = (category: string) => {
    switch (category) {
      case 'Génie': return 'gear'
      case 'Santé': return 'caduceus'
      case 'Commerce': return 'book'
      case 'Sciences': return 'chart'
      case 'Arts': return 'palette'
      default: return 'chip'
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
            {selectedSpeciality ? 'Retour aux spécialités' : 'Retour aux facultés'}
          </button>
          
          <div className={s.logo}>
            <BideyetiLogo />
          </div>
        </div>
      </header>

      <main className={s.main}>
        {!selectedSpeciality ? (
          // Vue des spécialités
          <>
            <section className={s.hero}>
              <h1 className={s.title}>Explorer par Spécialité</h1>
              <p className={s.subtitle}>Découvrez les domaines d'études et trouvez votre voie</p>
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
                  placeholder="Rechercher une spécialité ou domaine..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Rechercher une spécialité"
                />
              </div>
            </section>

            <section className={s.specialitiesGrid}>
              {filteredSpecialities.map(speciality => (
                <div key={speciality.id} className={s.specialityCard} onClick={() => handleSpecialityClick(speciality)}>
                  <div className={s.specialityHeader}>
                    <div className={s.specialityIcon}>
                      <FacultyIconSvg icon={getSpecialityIcon(speciality.category)} />
                    </div>
                    <div className={s.specialityInfo}>
                      <h3 className={s.specialityName}>{speciality.name}</h3>
                      <span className={s.specialityCategory}>{speciality.category}</span>
                    </div>
                    <span className={s.facultyCount}>
                      {speciality.faculties.length} faculté{speciality.faculties.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className={s.specialityDescription}>{speciality.description}</p>
                  <div className={s.specialityFooter}>
                    <button className={s.exploreBtn}>
                      Explorer cette spécialité
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
          // Vue des facultés de la spécialité sélectionnée
          <>
            <section className={s.specialityHero}>
              <div className={s.specialityInfo}>
                <div className={s.specialityIconLarge}>
                  <FacultyIconSvg icon={getSpecialityIcon(selectedSpeciality.category)} />
                </div>
                <h1 className={s.specialityTitle}>{selectedSpeciality.name}</h1>
                <p className={s.specialitySubtitle}>{selectedSpeciality.description}</p>
                <div className={s.specialityStats}>
                  <div className={s.stat}>
                    <span className={s.statNumber}>{selectedSpeciality.faculties.length}</span>
                    <span className={s.statLabel}>Facultés</span>
                  </div>
                  <div className={s.stat}>
                    <span className={s.statNumber}>{selectedSpeciality.category}</span>
                    <span className={s.statLabel}>Catégorie</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={s.facultiesSection}>
              <h2 className={s.sectionTitle}>Facultés proposant cette spécialité</h2>
              
              {getFacultiesBySpeciality(selectedSpeciality.id).length > 0 ? (
                <div className={s.facultiesGrid}>
                  {getFacultiesBySpeciality(selectedSpeciality.id).map(faculty => (
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
                        <span className={s.specialitiesLabel}>Spécialités disponibles:</span>
                        <div className={s.specialitiesList}>
                          {faculty.specialities.slice(0, 4).map((speciality, index) => (
                            <span key={index} className={s.specialityTag}>{speciality}</span>
                          ))}
                          {faculty.specialities.length > 4 && (
                            <span className={s.moreSpecialities}>+{faculty.specialities.length - 4}</span>
                          )}
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
                  <p>Cette spécialité n'est pas encore proposée par nos facultés partenaires.</p>
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
