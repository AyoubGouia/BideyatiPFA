import type { Page } from '../App'
import BideyetiLogo from '../components/BideyetiLogo'
import s from './AboutPage.module.css'

interface Props { nav: (p: Page) => void }

export default function AboutPage({ nav }: Props) {
  return (
    <div className={s.page}>
      {/* Header */}
      <header className={s.header}>
        <div
          className={s.logoWrap}
          onClick={() => nav('home')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && nav('home')}
          aria-label="Retour à l'accueil"
        >
          <BideyetiLogo />
        </div>

        <div className={s.headerBtns}>
          <button className={s.btnHdr} onClick={() => nav('form')}>Se connecter</button>
          <button className={s.btnHdrOrange} onClick={() => nav('register')}>S'inscrire</button>
        </div>
      </header>

      {/* Main content */}
      <main className={s.main}>
        <div className={s.container}>
          <h1 className={s.title}>À propos de Bideyety</h1>
          
          <div className={s.section}>
            <h2 className={s.sectionTitle}>Notre mission</h2>
            <p className={s.text}>
              Bideyety est une plateforme innovante d'orientation académique conçue pour aider les étudiants 
              à faire les bons choix pour leur avenir. Notre nom "بدايتي" signifie "mon début" en arabe, 
              reflétant notre engagement à accompagner chaque étudiant au début de son parcours universitaire.
            </p>
          </div>

          <div className={s.section}>
            <h2 className={s.sectionTitle}>Comment ça fonctionne ?</h2>
            <div className={s.steps}>
              <div className={s.step}>
                <div className={s.stepNumber}>1</div>
                <div className={s.stepContent}>
                  <h3 className={s.stepTitle}>Inscription</h3>
                  <p className={s.stepText}>Créez votre compte et remplissez votre profil académique</p>
                </div>
              </div>
              <div className={s.step}>
                <div className={s.stepNumber}>2</div>
                <div className={s.stepContent}>
                  <h3 className={s.stepTitle}>Évaluation</h3>
                  <p className={s.stepText}>Répondez à notre questionnaire d'orientation personnalisé</p>
                </div>
              </div>
              <div className={s.step}>
                <div className={s.stepNumber}>3</div>
                <div className={s.stepContent}>
                  <h3 className={s.stepTitle}>Recommandations</h3>
                  <p className={s.stepText}>Découvrez les facultés qui correspondent le mieux à votre profil</p>
                </div>
              </div>
            </div>
          </div>

          <div className={s.section}>
            <h2 className={s.sectionTitle}>Nos valeurs</h2>
            <div className={s.values}>
              <div className={s.value}>
                <h3 className={s.valueTitle}>🎯 Précision</h3>
                <p className={s.valueText}>Des recommandations basées sur des analyses approfondies</p>
              </div>
              <div className={s.value}>
                <h3 className={s.valueTitle}>🤝 Accompagnement</h3>
                <p className={s.valueText}>Un soutien personnalisé à chaque étape</p>
              </div>
              <div className={s.value}>
                <h3 className={s.valueTitle}>🌟 Excellence</h3>
                <p className={s.valueText}>Vous aider à atteindre votre plein potentiel</p>
              </div>
            </div>
          </div>

          <div className={s.ctaSection}>
            <h2 className={s.ctaTitle}>Prêt à commencer votre voyage ?</h2>
            <p className={s.ctaText}>Rejoignez des milliers d'étudiants qui ont trouvé leur voie avec Bideyety</p>
            <div className={s.ctaButtons}>
              <button className={s.btnPrimary} onClick={() => nav('register')}>
                Commencer maintenant
              </button>
              <button className={s.btnSecondary} onClick={() => nav('visitor')}>
                Explorer en visiteur
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.footerContent}>
            <button className={s.footerLink} onClick={() => nav('contact')}>Contact</button>
            <button className={s.footerLink} onClick={() => nav('faq')}>FAQ</button>
            <button className={s.footerLink} onClick={() => nav('legal')}>Mentions légales</button>
          </div>
          <p className={s.footerText}>© 2026 Bideyety | Tous droits réservés.</p>
        </footer>
      </main>
    </div>
  )
}
