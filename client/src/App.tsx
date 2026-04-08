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
import UniversityPage from './pages/UniversityPage'
import { useAuth } from './context/AuthContext'
import { useEffect } from 'react'

export type Page = 'home' | 'visitor' | 'university' | 'region' | 'speciality' | 'form' | 'register' | 'bac' | 'qcm' | 'about' | 'contact' | 'faq' | 'legal' | 'faculty-detail'

export type NavigationProps = {
  nav: (p: Page, regionId?: string, facultyId?: string) => void
  regionId?: string
  facultyId?: string
}

export default function App() {
  const { user, isLoadingAuth } = useAuth()
  const [page, setPage] = useState<Page>('home')
  const [regionId, setRegionId] = useState<string>()
  const [facultyId, setFacultyId] = useState<string>()
  const { user, isLoadingAuth } = useAuth()

  useEffect(() => {
    if (isLoadingAuth) return

    if (user) {
      // If logged in, don't allow visitor, login, or register pages
      if (page === 'visitor' || page === 'form' || page === 'register') {
        setPage('university')
      }
    } else {
      // If not logged in, don't allow university page
      if (page === 'university') {
        setPage('visitor')
      }
    }
  }, [user, page, isLoadingAuth])

  const nav = (p: Page, rId?: string, fId?: string) => {
    setPage(p)
    const targetPage = user && p === 'home' ? 'visitor' : p
    setPage(targetPage)
    if (rId) {
      setRegionId(rId)
    }
    if (fId) {
      setFacultyId(fId)
    }
    window.scrollTo(0, 0)
  }

  if (isLoadingAuth) return null

  return (
    <>
      {page === 'home'     && <HomePage     nav={nav} />}
      {page === 'visitor'  && <VisitorPage  nav={nav} />}
      {page === 'university' && <UniversityPage nav={nav} />}
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
      {page === 'faculty-detail' && <FacultyDetailPage nav={nav} facultyId={facultyId} />}
    </>
  )
}
