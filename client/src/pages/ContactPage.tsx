import { useState } from 'react'
import type { Page } from '../App'
import BideyetiLogo from '../components/BideyetiLogo'
import s from './ContactPage.module.css'

interface Props { nav: (p: Page) => void }

interface FormData {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactPage({ nav }: Props) {
  const [form, setForm] = useState<FormData>({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const setField = (key: keyof FormData, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Le nom est obligatoire.'
    if (!form.email.trim()) e.email = 'L\'email est obligatoire.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'L\'email n\'est pas valide.'
    if (!form.subject.trim()) e.subject = 'Le sujet est obligatoire.'
    if (!form.message.trim()) e.message = 'Le message est obligatoire.'
    else if (form.message.length < 10) e.message = 'Le message doit contenir au moins 10 caractères.'
    
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      setSubmitted(true)
      setTimeout(() => {
        setForm({ name: '', email: '', subject: '', message: '' })
        setSubmitted(false)
      }, 3000)
    }
  }

  if (submitted) {
    return (
      <div className={s.page}>
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

        <main className={s.main}>
          <div className={s.container}>
            <div className={s.successCard}>
              <div className={s.successIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2 className={s.successTitle}>Message envoyé !</h2>
              <p className={s.successText}>
                Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
              </p>
              <button className={s.btnBack} onClick={() => nav('home')}>
                Retour à l'accueil
              </button>
            </div>
          </div>
        </main>
      </div>
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
          <h1 className={s.title}>Contactez-nous</h1>
          
          <div className={s.content}>
            <div className={s.infoSection}>
              <h2 className={s.sectionTitle}>Nos coordonnées</h2>
              
              <div className={s.contactInfo}>
                <div className={s.contactItem}>
                  <div className={s.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div className={s.contactDetails}>
                    <h3>Email</h3>
                    <p>contact@bideyety.com</p>
                  </div>
                </div>

                <div className={s.contactItem}>
                  <div className={s.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className={s.contactDetails}>
                    <h3>Adresse</h3>
                    <p>123 Avenue de l'Éducation<br />Tunis, Tunisie</p>
                  </div>
                </div>

                <div className={s.contactItem}>
                  <div className={s.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className={s.contactDetails}>
                    <h3>Téléphone</h3>
                    <p>+216 71 234 567</p>
                  </div>
                </div>
              </div>

              <div className={s.hoursSection}>
                <h3 className={s.hoursTitle}>Horaires d'ouverture</h3>
                <div className={s.hoursList}>
                  <div className={s.hoursItem}>
                    <span>Lundi - Vendredi</span>
                    <span>08:00 - 18:00</span>
                  </div>
                  <div className={s.hoursItem}>
                    <span>Samedi</span>
                    <span>09:00 - 13:00</span>
                  </div>
                  <div className={s.hoursItem}>
                    <span>Dimanche</span>
                    <span>Fermé</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={s.formSection}>
              <h2 className={s.sectionTitle}>Envoyez-nous un message</h2>
              
              <form onSubmit={handleSubmit} className={s.form}>
                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="name">Nom complet *</label>
                  <input
                    id="name"
                    type="text"
                    className={`${s.input} ${errors.name ? s.inputError : ''}`}
                    placeholder="Votre nom et prénom"
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                  />
                  {errors.name && <span className={s.error}>{errors.name}</span>}
                </div>

                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    className={`${s.input} ${errors.email ? s.inputError : ''}`}
                    placeholder="votre@email.com"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                  />
                  {errors.email && <span className={s.error}>{errors.email}</span>}
                </div>

                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="subject">Sujet *</label>
                  <input
                    id="subject"
                    type="text"
                    className={`${s.input} ${errors.subject ? s.inputError : ''}`}
                    placeholder="Sujet de votre message"
                    value={form.subject}
                    onChange={e => setField('subject', e.target.value)}
                  />
                  {errors.subject && <span className={s.error}>{errors.subject}</span>}
                </div>

                <div className={s.fieldGroup}>
                  <label className={s.label} htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    className={`${s.textarea} ${errors.message ? s.inputError : ''}`}
                    placeholder="Décrivez votre demande en détail..."
                    rows={6}
                    value={form.message}
                    onChange={e => setField('message', e.target.value)}
                  />
                  {errors.message && <span className={s.error}>{errors.message}</span>}
                </div>

                <button type="submit" className={s.submitBtn}>
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.footerContent}>
            <button className={s.footerLink} onClick={() => nav('about')}>À propos</button>
            <button className={s.footerLink} onClick={() => nav('faq')}>FAQ</button>
            <button className={s.footerLink} onClick={() => nav('legal')}>Mentions légales</button>
          </div>
          <p className={s.footerText}>© 2026 Bideyety | Tous droits réservés.</p>
        </footer>
      </main>
    </div>
  )
}
