import { useState, useEffect } from 'react'
import type { Page } from '../App'
import type { Faculty } from '../data/faculties'
import { FACULTIES } from '../data/faculties'
import FacultyIconSvg from '../components/FacultyIcon'
import BideyetiLogo from '../components/BideyetiLogo'
import s from './FacultyDetailPage.module.css'

interface Props {
  nav: (p: Page, facultyId?: string) => void
  facultyId?: string
}

export default function FacultyDetailPage({ nav, facultyId }: Props) {
  const [faculty, setFaculty] = useState<Faculty | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facultyId) {
      const found = FACULTIES.find(f => f.id === facultyId)
      setFaculty(found || null)
      setLoading(false)
    }
  }, [facultyId])

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.loading}>
          <div className={s.spinner}></div>
          <p>Chargement des informations...</p>
        </div>
      </div>
    )
  }

  if (!faculty) {
    return (
      <div className={s.page}>
        <div className={s.error}>
          <h2>Faculté non trouvée</h2>
          <p>La faculté que vous recherchez n'existe pas.</p>
          <button className={s.backBtn} onClick={() => nav('visitor')}>
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerContent}>
          <button className={s.backBtn} onClick={() => nav('visitor')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <polyline points="15 18 9 12 15 6"/>
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
              <FacultyIconSvg icon={faculty.icon} />
            </div>
            <div className={s.heroText}>
              <h1 className={s.title}>{faculty.name}</h1>
              <p className={s.subtitle}>{faculty.sub}</p>
              <span className={s.category}>{faculty.cat}</span>
            </div>
          </div>
        </section>

        <section className={s.description}>
          <h2>Description</h2>
          <p>{faculty.description}</p>
        </section>

        <section className={s.programs}>
          <h2>Programmes proposés</h2>
          <div className={s.programGrid}>
            {faculty.programs.map((program, index) => (
              <div key={index} className={s.programCard}>
                <div className={s.programIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#F47920" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <span>{program}</span>
              </div>
            ))}
          </div>
        </section>

        <div className={s.infoGrid}>
          <section className={s.infoCard}>
            <h3>Admission</h3>
            <p>{faculty.admission}</p>
          </section>

          <section className={s.infoCard}>
            <h3>Durée</h3>
            <p>{faculty.duration}</p>
          </section>

          <section className={s.infoCard}>
            <h3>Localisation</h3>
            <p>{faculty.location}</p>
          </section>
        </div>

        <section className={s.contact}>
          <h2>Contact</h2>
          <div className={s.contactGrid}>
            {faculty.email && (
              <a href={`mailto:${faculty.email}`} className={s.contactItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {faculty.email}
              </a>
            )}
            
            {faculty.phone && (
              <a href={`tel:${faculty.phone}`} className={s.contactItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {faculty.phone}
              </a>
            )}
            
            {faculty.website && (
              <a href={faculty.website} target="_blank" rel="noopener noreferrer" className={s.contactItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Site web
              </a>
            )}
          </div>
        </section>

        <section className={s.highlights}>
          <h2>Points forts</h2>
          <div className={s.highlightsGrid}>
            <div className={s.highlightCard}>
              <div className={s.highlightIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#F47920" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3>Formation d'excellence</h3>
              <p>Programmes reconnus et enseignants experts</p>
            </div>
            
            <div className={s.highlightCard}>
              <div className={s.highlightIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#F47920" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Réseau professionnel</h3>
              <p>Accès à un large réseau d'anciens élèves</p>
            </div>
            
            <div className={s.highlightCard}>
              <div className={s.highlightIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#F47920" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <h3>Infrastructure moderne</h3>
              <p>Équipements de pointe et laboratoires avancés</p>
            </div>
          </div>
        </section>

        <section className={s.actions}>
          <button className={s.applyBtn} onClick={() => nav('register')}>
            Postuler maintenant
          </button>
          <button className={s.compareBtn} onClick={() => nav('visitor')}>
            Comparer avec d'autres facultés
          </button>
        </section>
      </main>

      <footer className={s.footer}>
        <p>© 2026 Bideyety | Tous droits réservés.</p>
      </footer>
    </div>
  )
}
