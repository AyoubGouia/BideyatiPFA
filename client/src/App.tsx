import { useEffect, useState } from 'react'
import HomePage       from './pages/HomePage'
import VisitorPage    from './pages/VisitorPage'
import RegionPage     from './pages/RegionPage'
import SpecialityPage from './pages/SpecialityPage'
import FormPage       from './pages/FormPage'
import RegisterPage   from './pages/register/RegisterPage'
import BacFormPage    from './pages/register/BacFormPage'
import QcmPage        from './pages/register/QcmPage'
import AboutPage      from './pages/AboutPage'
import ContactPage    from './pages/ContactPage'
import FaqPage        from './pages/FaqPage'
import LegalPage      from './pages/LegalPage'
import FacultyDetailPage from './pages/FacultyDetailPage'
import SpecialiteDetailPage from './pages/SpecialiteDetailPage'
import UniversityPage from './pages/UniversityPage'
import DomainEtablissementsPage from './pages/DomainEtablissementsPage'
import FavorisPage from './pages/FavorisPage'
import RecommendationsPage from './pages/RecommendationsPage'
import { useAuth } from './context/AuthContext'
import EducationLoader from './components/EducationLoader'
import FloatingProfileWidget from './components/FloatingProfileWidget'

export type Page =
  | 'home'
  | 'visitor'
  | 'university'
  | 'domain-etabs'
  | 'region'
  | 'speciality'
  | 'form'
  | 'register'
  | 'bac'
  | 'qcm'
  | 'about'
  | 'contact'
  | 'faq'
  | 'legal'
  | 'faculty-detail'
  | 'specialite-detail'
  | 'favoris'
  | 'recommandations'

export type NavigationProps = {
  nav: (
    p: Page,
    regionId?: string,
    facultyId?: string,
    specialiteId?: string
  ) => void
  regionId?: string
  facultyId?: string
}

export default function App() {
  const { user, isLoadingAuth, refreshUser } = useAuth()
  const [page, setPage] = useState<Page>('home')
  const [regionId, setRegionId] = useState<string>()
  const [facultyId, setFacultyId] = useState<string>()
  const [specialiteId, setSpecialiteId] = useState<string>()
  const [domainExplore, setDomainExplore] = useState<{
    label: string
    queries: string[]
  } | null>(null)

  const openDomainExplore = (label: string, queries: string[]) => {
    setDomainExplore({ label, queries })
    setPage('domain-etabs')
  }

  useEffect(() => {
    if (isLoadingAuth) return

    if (user) {
      if (page === 'visitor' || page === 'form' || page === 'register') {
        setPage('university')
      }
    } else {
      const restrictedPages: Page[] = [
        'university',
        'domain-etabs',
        'speciality',
        'faculty-detail',
        'specialite-detail',
        'favoris',
        'recommandations'
      ]
      if (restrictedPages.includes(page)) {
        setPage('register')
      }
    }
  }, [user, page, isLoadingAuth])

  useEffect(() => {
    if (isLoadingAuth) return
    const publicEntryPages: Page[] = ['home', 'form', 'register', 'bac', 'qcm']
    if (user && publicEntryPages.includes(page)) {
      setPage('visitor')
    }
  }, [isLoadingAuth, user, page])

  useEffect(() => {
    if (page === 'domain-etabs' && !domainExplore) {
      setPage('university')
    }
  }, [page, domainExplore])

  const nav = (p: Page, rId?: string, fId?: string, specId?: string) => {
    const publicPages: Page[] = [
      'home',
      'visitor',
      'region',
      'about',
      'contact',
      'faq',
      'legal',
      'form',
      'register',
      'bac',
      'qcm'
    ]

    let targetPage: Page = p
    if (!user && !publicPages.includes(p)) {
      targetPage = 'register'
    } else if (user && p === 'home') {
      targetPage = 'university'
    }

    setPage(targetPage)
    if (rId) {
      setRegionId(rId)
    }
    if (fId) {
      setFacultyId(fId)
    }
    if (p === 'faculty-detail') {
      setSpecialiteId(undefined)
    }
    if (p === 'specialite-detail' && specId) {
      setSpecialiteId(specId)
    }
    window.scrollTo(0, 0)
  }

  if (isLoadingAuth) {
    return (
      <EducationLoader
        fullScreen
        label="Preparation de votre espace"
        caption="Organisation des etudes, etablissements et specialites."
      />
    )
  }

  return (
    <>
      {page === 'home'     && <HomePage     nav={nav} />}
      {page === 'visitor'  && (
        <VisitorPage nav={nav} openDomainExplore={openDomainExplore} />
      )}
      {page === 'university' && (
        <UniversityPage nav={nav} openDomainExplore={openDomainExplore} />
      )}
      {page === 'domain-etabs' && domainExplore && (
        <DomainEtablissementsPage
          nav={nav}
          domainLabel={domainExplore.label}
          searchQueries={domainExplore.queries}
        />
      )}
      {page === 'region'   && <RegionPage   nav={nav} />}
      {page === 'speciality' && <SpecialityPage nav={nav} />}
      {page === 'form'     && <FormPage     nav={nav} />}
      {page === 'register' && <RegisterPage nav={nav} />}
      {page === 'bac'      && <BacFormPage  nav={nav} />}
      {page === 'qcm'      && <QcmPage      nav={nav} />}
      {page === 'about'    && <AboutPage    nav={nav} />}
      {page === 'contact'  && <ContactPage  nav={nav} />}
      {page === 'faq'      && <FaqPage      nav={nav} />}
      {page === 'legal'    && <LegalPage    nav={nav} />}
      {page === 'faculty-detail' && (
        <FacultyDetailPage nav={nav} facultyId={facultyId} />
      )}
      {page === 'specialite-detail' && (
        <SpecialiteDetailPage
          nav={nav}
          specialiteId={specialiteId}
          facultyId={facultyId}
        />
      )}
      {page === 'favoris' && <FavorisPage nav={nav} />}
      {page === 'recommandations' && <RecommendationsPage nav={nav} />}
      <FloatingProfileWidget user={user} page={page} onProfileUpdate={refreshUser} onNav={nav} />
    </>
  )
}
