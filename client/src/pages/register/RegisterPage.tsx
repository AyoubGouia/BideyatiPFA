import { useState, useEffect } from 'react'
import type { Page } from '../../App'
import { useRegistration } from '../../context/RegistrationContext'
import s from './StepLayout.module.css'
import BrandHeader from './BrandHeader'
import bgForm from '../../assets/bg-form.png'

interface Props { nav: (p: Page) => void }

interface FormState {
  nom: string
  prenom: string
  dob: string
  numeroBAC: string
  email: string
  pwd: string
  confirm: string
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#b8c8d2"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#b8c8d2"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

export default function RegisterPage({ nav }: Props) {
  const { data, updateData } = useRegistration();
  
  const [form, setForm] = useState<FormState>({ 
    nom: data.nom || '', 
    prenom: data.prenom || '', 
    dob: data.dob || '', 
    numeroBAC: data.numeroBAC || '',
    email: data.email || '', 
    pwd: data.pwd || '', 
    confirm: data.confirm || '' 
  })
  const [showPwd,  setShowPwd]  = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [errors,   setErrors]   = useState<Record<string, string>>({})

  const setField = (key: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.nom.trim())    e.nom    = 'Le nom est obligatoire.'
    if (!form.prenom.trim()) e.prenom = 'Le prénom est obligatoire.'
    if (!form.dob)           e.dob    = 'La date de naissance est obligatoire.'
    if (!form.numeroBAC.trim()) e.numeroBAC = 'Le numéro du Bac est obligatoire.'
    if (!form.email.trim())  e.email  = 'L\'email est obligatoire.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'L\'email n\'est pas valide.'
    if (!form.pwd)           e.pwd    = 'Le mot de passe est obligatoire.'
    else if (form.pwd.length < 6) e.pwd = 'Minimum 6 caractères.'
    if (!form.confirm)       e.confirm = 'Veuillez confirmer votre mot de passe.'
    else if (form.pwd && form.pwd !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className={s.page}>
      <img src={bgForm} alt="" className={s.bgAbsolute} aria-hidden="true" />
      <div className={s.scroll}>
        <BrandHeader step="Étape 1 / 3" subtitle="Inscription – Informations personnelles" />

        <div className={s.sectionCard}>
          <p className={s.sectionTitle}>Vos informations</p>
          <p className={s.sectionSub}>Tous les champs sont obligatoires</p>

          <div className={s.inputGroup}>
            <div className={s.row2}>
              <div className={s.fieldWrap}>
                <label className={s.label} htmlFor="r-nom">Nom *</label>
                <input id="r-nom"
                  className={`${s.input} ${errors.nom ? s.inputError : ''}`}
                  placeholder="Votre nom" value={form.nom}
                  onChange={e => setField('nom', e.target.value)} />
                {errors.nom && <span className={s.errMsg}>{errors.nom}</span>}
              </div>
              <div className={s.fieldWrap}>
                <label className={s.label} htmlFor="r-prenom">Prénom *</label>
                <input id="r-prenom"
                  className={`${s.input} ${errors.prenom ? s.inputError : ''}`}
                  placeholder="Votre prénom" value={form.prenom}
                  onChange={e => setField('prenom', e.target.value)} />
                {errors.prenom && <span className={s.errMsg}>{errors.prenom}</span>}
              </div>
            </div>

            <div className={s.fieldWrap}>
              <label className={s.label} htmlFor="r-dob">Date de naissance *</label>
              <input id="r-dob" type="date"
                className={`${s.input} ${errors.dob ? s.inputError : ''}`}
                value={form.dob} onChange={e => setField('dob', e.target.value)} />
              {errors.dob && <span className={s.errMsg}>{errors.dob}</span>}
            </div>

            <div className={s.fieldWrap}>
              <label className={s.label} htmlFor="r-bac">Numéro d'inscription au Bac *</label>
              <input id="r-bac" type="text"
                className={`${s.input} ${errors.numeroBAC ? s.inputError : ''}`}
                placeholder="Votre numéro d'inscription" value={form.numeroBAC}
                onChange={e => setField('numeroBAC', e.target.value)} />
              {errors.numeroBAC && <span className={s.errMsg}>{errors.numeroBAC}</span>}
            </div>

            <div className={s.fieldWrap}>
              <label className={s.label} htmlFor="r-email">Email *</label>
              <input id="r-email" type="email"
                className={`${s.input} ${errors.email ? s.inputError : ''}`}
                placeholder="Votre adresse email" value={form.email}
                onChange={e => setField('email', e.target.value)} />
              {errors.email && <span className={s.errMsg}>{errors.email}</span>}
            </div>

            <div className={s.fieldWrap}>
              <label className={s.label} htmlFor="r-pwd">Mot de passe *</label>
              <div className={s.pwdWrap}>
                <input id="r-pwd"
                  type={showPwd ? 'text' : 'password'}
                  className={`${s.input} ${errors.pwd ? s.inputError : ''}`}
                  placeholder="Minimum 6 caractères" value={form.pwd}
                  onChange={e => setField('pwd', e.target.value)} />
                <button type="button" className={s.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                  <EyeIcon open={showPwd} />
                </button>
              </div>
              {errors.pwd && <span className={s.errMsg}>{errors.pwd}</span>}
            </div>

            <div className={s.fieldWrap}>
              <label className={s.label} htmlFor="r-conf">Confirmer le mot de passe *</label>
              <div className={s.pwdWrap}>
                <input id="r-conf"
                  type={showConf ? 'text' : 'password'}
                  className={`${s.input} ${errors.confirm ? s.inputError : ''}`}
                  placeholder="Répétez le mot de passe" value={form.confirm}
                  onChange={e => setField('confirm', e.target.value)} />
                <button type="button" className={s.eyeBtn} onClick={() => setShowConf(v => !v)}>
                  <EyeIcon open={showConf} />
                </button>
              </div>
              {errors.confirm && <span className={s.errMsg}>{errors.confirm}</span>}
            </div>
          </div>
        </div>

        <div className={s.navRow}>
          <button className={s.btnPrev} onClick={() => nav('home')}>Retour</button>
          <button className={s.btnNext} onClick={() => { 
            if (validate()) {
              updateData(form);
              nav('bac');
            }
          }}>Suivant</button>
        </div>
      </div>
      <p className={s.footer}>© 2026 Bideyety  | Tous droits réservés.</p>
    </div>
  )
}