import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import s      from './HomePage.module.css'
import bgHome from '../assets/Design sans titre (1).png'

interface Props { nav: (p: Page) => void }

export default function HomePage({ nav }: Props) {
  const { user, logout } = useAuth();

  return (
    <main className={s.page}>
      <img src={bgHome} alt="" className={s.bg} aria-hidden="true" />

      <div className={s.topBar}>
        {user ? (
          <button className={s.ghost} onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Se déconnecter
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        ) : (
          <>
            <button className={s.ghost}  onClick={() => nav('form')}>Se connecter</button>
            <button className={s.orange} onClick={() => nav('register')}>S'inscrire</button>
          </>
        )}
      </div>

      <div className={s.bottom}>
        <p className={s.tagline}>
          Bideyety&nbsp;- fais le bon choix,<br />pas au hasard.
        </p>
        {user ? (
          <button className={s.cta} onClick={() => nav('university')}>
            Explorer les universités
          </button>
        ) : (
          <button className={s.cta} onClick={() => nav('visitor')}>
            Commencer en tant que visiteur
          </button>
        )}
      </div>
    </main>
  )
}
