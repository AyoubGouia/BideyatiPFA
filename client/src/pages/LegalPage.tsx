import type { Page } from '../App'
import BideyetiLogo from '../components/BideyetiLogo'
import s from './LegalPage.module.css'

interface Props { nav: (p: Page) => void }

export default function LegalPage({ nav }: Props) {
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
          <h1 className={s.title}>Mentions Légales</h1>
          
          <div className={s.legalContent}>
            <section className={s.section}>
              <h2 className={s.sectionTitle}>Éditeur du site</h2>
              <div className={s.contentBlock}>
                <p><strong>Bideyety</strong></p>
                <p>Plateforme d'orientation académique</p>
                <p>123 Avenue de l'Éducation</p>
                <p>1002 Tunis, Tunisie</p>
                <p>Email : contact@bideyety.com</p>
                <p>Téléphone : +216 71 234 567</p>
              </div>
            </section>

            <section className={s.section}>
              <h2 className={s.sectionTitle}>Directeur de la publication</h2>
              <div className={s.contentBlock}>
                <p><strong>M. Ahmed Ben Salah</strong></p>
                <p>Fondateur et Directeur Général</p>
                <p>Email : a.bensalah@bideyety.com</p>
              </div>
            </section>

            <section className={s.section}>
              <h2 className={s.sectionTitle}>Hébergement</h2>
              <div className={s.contentBlock}>
                <p><strong>GlobalNet Tunisia</strong></p>
                <p>Fournisseur d'hébergement web</p>
                <p>45 Rue du Technopôle</p>
                <p>2080 Ariana, Tunisie</p>
                <p>Téléphone : +216 70 123 456</p>
              </div>
            </section>

            <section className={s.section}>
              <h2 className={s.sectionTitle}>Propriété intellectuelle</h2>
              <div className={s.contentBlock}>
                <p>
                  L'ensemble de ce site, y compris sa structure, son graphisme, ses textes, 
                  ses images, ses animations, sons et vidéos, est la propriété exclusive de Bideyety, 
                  à l'exception des éléments appartenant à ses partenaires.
                </p>
                <p>
                  Toute reproduction, distribution, modification, adaptation, retransmission ou 
                  publication, même partielle, de ces différents éléments est strictement interdite 
                  sans l'accord exprès écrit de Bideyety.
                </p>
                <p>
                  Cette représentation ou reproduction, par quelque procédé que ce soit, constitue 
                  une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
                </p>
              </div>
            </section>

            <section className={s.section}>
              <h2 className={s.sectionTitle}>Données personnelles</h2>
              <div className={s.contentBlock}>
                <p>
                  Conformément à la loi n°2004-63 du 27 juillet 2004 relative à la protection 
                  des données personnelles, vous disposez d'un droit d'accès, de modification, 
                  de rectification et de suppression des données qui vous concernent.
                </p>
                <p>
                  Pour exercer ce droit, il vous suffit de nous adresser un email à l'adresse : 
                  privacy@bideyety.com en joignant une copie de votre pièce d'identité.
                </p>
                <p>
                  Les données personnelles collectées sur ce site sont destinées à Bideyety 
                  pour la gestion de votre compte, l'amélioration de nos services et l'envoi 
                  d'informations pertinentes. Elles ne seront jamais cédées à des tiers sans 
                  votre consentement préalable.
                </p>
              </div>
            </section>

            <section className={s.section}>
              <h2 className={s.sectionTitle}>Cookies</h2>
              <div className={s.contentBlock}>
                <p>
                  Ce site utilise des cookies nécessaires à son bon fonctionnement et des cookies 
                  de mesure d'audience. Les cookies sont de petits fichiers texte stockés sur votre 
                  appareil qui nous permettent de reconnaître votre navigateur et d'améliorer 
                  votre expérience utilisateur.
                </p>
                <p>
                  Vous pouvez désactiver les cookies dans les paramètres de votre navigateur. 
                  Toutefois, cela pourrait affecter certaines fonctionnalités du site.
                </p>
                <p>
                  Pour plus d'informations sur notre utilisation des cookies, 
                  consultez notre politique de cookies disponible sur demande.
                </p>
              </div>
            </section>

            <section className={s.section}>
              <h2 className={s.sectionTitle}>Limitation de responsabilité</h2>
              <div className={s.contentBlock}>
                <p>
                  Bideyety s'efforce de fournir des informations aussi précises que possible. 
                  Toutefois, nous ne pouvons garantir l'exactitude, la complétude ou l'actualité 
                  des informations diffusées sur ce site.
                </p>
                <p>
                  Les recommandations d'orientation fournies par Bideyety sont basées sur des 
                  algorithmes et des statistiques. Elles constituent des conseils et ne peuvent 
                  en aucun cas engager notre responsabilité quant aux décisions finales prises 
                  par les utilisateurs.
                </p>
                <p>
                  Bideyety décline toute responsabilité pour les dommages directs ou indirects 
                  résultant de l'utilisation de ce site ou des informations qui y sont présentées.
                </p>
              </div>
            </section>

            <section className={s.section}>
              <h2 className={s.sectionTitle}>Droit applicable et juridiction</h2>
              <div className={s.contentBlock}>
                <p>
                  Les présentes mentions légales sont régies par le droit tunisien. 
                  Tout litige relatif à l'utilisation du site Bideyety sera de la compétence 
                  exclusive des tribunaux tunisiens.
                </p>
              </div>
            </section>

            <section className={s.section}>
              <h2 className={s.sectionTitle}>Contact</h2>
              <div className={s.contentBlock}>
                <p>
                  Pour toute question relative à ces mentions légales ou pour signaler 
                  un contenu illicite, vous pouvez nous contacter :
                </p>
                <p>
                  Email : legal@bideyety.com<br />
                  Téléphone : +216 71 234 567<br />
                  Adresse : 123 Avenue de l'Éducation, 1002 Tunis, Tunisie
                </p>
              </div>
            </section>

            <div className={s.updateInfo}>
              <p>
                <strong>Dernière mise à jour :</strong> 4 avril 2026
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.footerContent}>
            <button className={s.footerLink} onClick={() => nav('about')}>À propos</button>
            <button className={s.footerLink} onClick={() => nav('contact')}>Contact</button>
            <button className={s.footerLink} onClick={() => nav('faq')}>FAQ</button>
          </div>
          <p className={s.footerText}>© 2026 Bideyety | Tous droits réservés.</p>
        </footer>
      </main>
    </div>
  )
}
