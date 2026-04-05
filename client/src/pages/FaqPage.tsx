import { useState } from 'react'
import type { Page } from '../App'
import BideyetiLogo from '../components/BideyetiLogo'
import s from './FaqPage.module.css'

interface Props { nav: (p: Page) => void }

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: "Qu'est-ce que Bideyety ?",
    answer: "Bideyety est une plateforme d'orientation académique qui aide les étudiants à choisir la faculté et le parcours qui correspondent le mieux à leur profil, leurs intérêts et leurs aspirations professionnelles.",
    category: "Général"
  },
  {
    id: 2,
    question: "Comment fonctionne l'algorithme de recommandation ?",
    answer: "Notre algorithme analyse plusieurs facteurs : vos résultats académiques, vos centres d'intérêt, vos compétences personnelles et vos objectifs de carrière. Il croise ces données avec les caractéristiques de chaque faculté pour vous proposer les options les plus pertinentes.",
    category: "Fonctionnement"
  },
  {
    id: 3,
    question: "Bideyety est-il gratuit ?",
    answer: "Oui, l'inscription et l'utilisation de base de Bideyety sont entièrement gratuits. Nous proposons également des services premium pour un accompagnement plus personnalisé avec des conseillers d'orientation.",
    category: "Tarifs"
  },
  {
    id: 4,
    question: "Quelles informations sont nécessaires pour créer un compte ?",
    answer: "Pour créer votre compte, vous aurez besoin de votre adresse email, d'un mot de passe, et de quelques informations de base comme votre nom, prénom et date de naissance. Ensuite, vous pourrez compléter votre profil progressivement.",
    category: "Inscription"
  },
  {
    id: 5,
    question: "Mes données personnelles sont-elles sécurisées ?",
    answer: "Absolument. Nous respectons la confidentialité de vos données et utilisons des protocoles de sécurité avancés pour protéger vos informations personnelles. Consultez notre politique de confidentialité pour plus de détails.",
    category: "Confidentialité"
  },
  {
    id: 6,
    question: "Puis-je modifier mes réponses au questionnaire d'orientation ?",
    answer: "Oui, vous pouvez modifier vos réponses à tout moment depuis votre espace personnel. Vos recommandations seront automatiquement mises à jour en fonction de vos nouvelles réponses.",
    category: "Fonctionnement"
  },
  {
    id: 7,
    question: "Comment contacter le support technique ?",
    answer: "Vous pouvez nous contacter par email à support@bideyety.com, par téléphone au +216 71 234 567, ou via le formulaire de contact sur notre site. Notre équipe est disponible du lundi au vendredi, 8h à 18h.",
    category: "Support"
  },
  {
    id: 8,
    question: "Bideyety couvre-t-il toutes les universités tunisiennes ?",
    answer: "Nous couvrons la majorité des universités et facultés publiques et privées en Tunisie. Notre base de données est régulièrement mise à jour pour inclure les nouveaux programmes et établissements.",
    category: "Contenu"
  },
  {
    id: 9,
    question: "Les recommandations sont-elles garanties ?",
    answer: "Nos recommandations sont basées sur des analyses statistiques et des données fiables, mais elles restent des conseils d'orientation. La décision finale vous appartient, et nous vous encourageons à visiter les établissements et à rencontrer des professionnels du secteur.",
    category: "Recommandations"
  },
  {
    id: 10,
    question: "Puis-je utiliser Bideyety si je suis déjà à l'université ?",
    answer: "Oui ! Bideyety est également utile pour les étudiants qui souhaitent se réorienter, changer de filière, ou explorer des options de poursuite d'études et de spécialisation.",
    category: "Utilisation"
  },
  {
    id: 11,
    question: "Comment les parents peuvent-ils accompagner leurs enfants ?",
    answer: "Nous encourageons la participation des parents dans le processus d'orientation. Vous pouvez créer un compte accompagnant pour suivre les progrès de votre enfant et accéder à des ressources spécifiques pour les parents.",
    category: "Parents"
  },
  {
    id: 12,
    question: "Y a-t-il une application mobile ?",
    answer: "Oui, notre application mobile est disponible sur iOS et Android. Elle vous permet d'accéder à toutes les fonctionnalités de Bideyety depuis votre smartphone, avec une interface optimisée pour une utilisation nomade.",
    category: "Technique"
  }
]

const categories = ['Toutes', 'Général', 'Fonctionnement', 'Inscription', 'Tarifs', 'Confidentialité', 'Support', 'Contenu', 'Recommandations', 'Utilisation', 'Parents', 'Technique']

export default function FaqPage({ nav }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('Toutes')
  const [openItems, setOpenItems] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'Toutes' || faq.category === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

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
          <h1 className={s.title}>Questions Fréquemment Posées</h1>
          <p className={s.subtitle}>
            Trouvez des réponses aux questions les plus courantes sur Bideyety
          </p>

          {/* Search */}
          <div className={s.searchSection}>
            <div className={s.searchBox}>
              <svg
                width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="#aab5be"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher une question..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Rechercher une question"
              />
            </div>
          </div>

          {/* Categories */}
          <div className={s.categoriesSection}>
            <h2 className={s.categoriesTitle}>Catégories</h2>
            <div className={s.categoriesList}>
              {categories.map(category => (
                <button
                  key={category}
                  className={`${s.categoryBtn} ${selectedCategory === category ? s.categoryBtnActive : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className={s.faqSection}>
            {filteredFaqs.length === 0 ? (
              <div className={s.noResults}>
                <div className={s.noResultsIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#aab5be" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <h3>Aucune réponse trouvée</h3>
                <p>Essayez de modifier votre recherche ou de changer de catégorie</p>
              </div>
            ) : (
              <div className={s.faqList}>
                {filteredFaqs.map(faq => (
                  <div key={faq.id} className={s.faqItem}>
                    <button
                      className={s.faqQuestion}
                      onClick={() => toggleItem(faq.id)}
                      aria-expanded={openItems.includes(faq.id)}
                    >
                      <span className={s.questionText}>{faq.question}</span>
                      <div className={`${s.chevron} ${openItems.includes(faq.id) ? s.chevronOpen : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </button>
                    <div className={`${s.faqAnswer} ${openItems.includes(faq.id) ? s.faqAnswerOpen : ''}`}>
                      <p>{faq.answer}</p>
                      <span className={s.categoryTag}>{faq.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className={s.ctaSection}>
            <h2 className={s.ctaTitle}>Vous ne trouvez pas votre réponse ?</h2>
            <p className={s.ctaText}>Notre équipe est là pour vous aider</p>
            <div className={s.ctaButtons}>
              <button className={s.btnPrimary} onClick={() => nav('contact')}>
                Contacter le support
              </button>
              <button className={s.btnSecondary} onClick={() => nav('register')}>
                Créer un compte
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.footerContent}>
            <button className={s.footerLink} onClick={() => nav('about')}>À propos</button>
            <button className={s.footerLink} onClick={() => nav('contact')}>Contact</button>
            <button className={s.footerLink} onClick={() => nav('legal')}>Mentions légales</button>
          </div>
          <p className={s.footerText}>© 2026 Bideyety | Tous droits réservés.</p>
        </footer>
      </main>
    </div>
  )
}
