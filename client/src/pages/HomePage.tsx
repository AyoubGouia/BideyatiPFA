import type { Page } from '../App'
import s      from './HomePage.module.css'
import bgHome from '../assets/Design sans titre (1).png'

interface Props { nav: (p: Page) => void }

export default function HomePage({ nav }: Props) {
  return (
    <main className={s.page}>
      <img src={bgHome} alt="" className={s.bg} aria-hidden="true" />

      <div className={s.topBar}>
        <button className={s.ghost}  onClick={() => nav('form')}>Se connecter</button>
        <button className={s.orange} onClick={() => nav('register')}>S'inscrire</button>
      </div>

      <div className={s.bottom}>
        <p className={s.tagline}>
          Bideyety&nbsp;- fais le bon choix,<br />pas au hasard.
        </p>
        <button className={s.cta} onClick={() => nav('visitor')}>
          Commencer en tant que visiteur
        </button>
      </div>
    </main>
  )
}
