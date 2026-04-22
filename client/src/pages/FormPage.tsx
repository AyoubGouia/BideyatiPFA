import { useState } from 'react'
import type { Page } from '../App'
import { useAuth } from '../context/AuthContext'
import s      from './FormPage.module.css'
import bgForm from '../assets/bg-form.png'

interface Props { nav: (p: Page) => void }

export default function FormPage({ nav }: Props) {
  const [email,   setEmail]   = useState('')
  const [pwd,     setPwd]     = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [active,  setActive]  = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleFocus = () => setActive(true)
  const handleBlur  = () => { if (!email && !pwd) setActive(false) }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pwd) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await login({ email, motDePasse: pwd });
      nav('university');
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.details) {
        setError('Erreur de validation des champs');
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={s.page}>
      <img src={bgForm} alt="" className={s.bg} aria-hidden="true" />
      <div className={`${s.overlay} ${active ? s.overlayActive : ''}`} />

      <div className={s.shell}>
        <div className={s.card}>

          <div className={s.brand}>
            <span className={s.brandName}>BIDEYETY</span>
            <svg className={s.brandIcon} viewBox="0 0 24 24" fill="none"
              stroke="#d96a10" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              width="22" height="22">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#F47920" stroke="#d96a10" strokeWidth="2" />
            </svg>
          </div>

          <h1 className={s.heading}>Prêt à trouver votre voie&nbsp;?</h1>
          <p className={s.sub}>
            Connectez-vous pour explorer toutes les possibilités d'orientation.
          </p>

          {error && <div style={{ color: '#d96a10', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center', backgroundColor: '#fef1e8', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

          <form onSubmit={handleLogin} className={s.loginForm}>
            <div className={s.field}>
            <input
              className={`${s.input} ${email ? s.inputFilled : ''}`}
              type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)}
              onFocus={handleFocus} onBlur={handleBlur} autoComplete="email"
            />
            <span className={s.fieldIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#b8c8d2"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
          </div>

          <div className={s.field}>
            <input
              className={`${s.input} ${pwd ? s.inputFilled : ''}`}
              type={showPwd ? 'text' : 'password'} placeholder="Mot de passe"
              value={pwd} onChange={e => setPwd(e.target.value)}
              onFocus={handleFocus} onBlur={handleBlur} autoComplete="current-password"
            />
            <button className={s.eyeBtn} type="button"
              onClick={() => setShowPwd(v => !v)}
              aria-label={showPwd ? 'Masquer' : 'Afficher'}>
              {showPwd ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="#b8c8d2"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#b8c8d2"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          <div className={s.actions}>
            <button 
              className={s.btnConnect} 
              type="submit" 
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? 'CONNEXION...' : 'SE CONNECTER'}
            </button>
            <button className={s.btnRegister} type="button" onClick={() => nav('register')}>S'INSCRIRE</button>
          </div>
          </form>

        </div>
      </div>

      <p className={s.footer}>© 2026 Bideyety | Tous droits réservés.</p>
    </div>
  )
}
