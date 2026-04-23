import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import s from './AdminPage.module.css'

interface Props {
  nav: (p: Page) => void
}

export default function AdminPage({ nav }: Props) {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    nav('home')
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Espace Administrateur</h1>
        <button className={s.logoutBtn} onClick={handleLogout}>
          Déconnexion
        </button>
      </header>

      <main className={s.main}>
        <p className={s.placeholder}>Votre interface d'administration sera ici.</p>
      </main>
    </div>
  )
}
