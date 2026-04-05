import { useState } from 'react'
import type { Page } from '../../App'
import s from './StepLayout.module.css'
import BrandHeader from './BrandHeader'
import bgForm from '../../assets/bg-form.png'

interface Props { nav: (p: Page) => void }

type Section = 'Math' | 'Science' | 'Info' | 'Technique' | 'Lettre' | 'Économie' | 'Sport'

const SUBJECTS: Record<Section, string[]> = {
  Math:      ['Mathématiques', 'Physique', 'Sciences', 'Philosophie', 'Français', 'Anglais', 'Arabe', 'Informatique', 'Option'],
  Science:   ['Sciences', 'Physique', 'Mathématiques', 'Arabe', 'Philosophie', 'Français', 'Anglais', 'Option', 'Informatique'],
  Info:      ['Mathématiques', 'Physique', 'Algo', 'STI', 'Français', 'Arabe', 'Anglais', 'Option', 'Philosophie'],
  Technique: ['Technique', 'Mathématiques', 'Physique', 'Français', 'Anglais', 'Arabe', 'Option', 'Informatique', 'Philosophie'],
  Lettre:    ['Français', 'Anglais', 'Arabe', 'Option', 'Histoire', 'Géographie', 'Informatique', 'Islamique', 'Philosophie'],
  Économie:  ['Économie', 'Gestion', 'Mathématiques', 'Histoire', 'Géographie', 'Français', 'Anglais', 'Arabe', 'Philosophie', 'Option', 'Informatique'],
  Sport:     ['Mathématiques', 'Physique', 'Sciences', 'Arabe', 'Philosophie', 'Français', 'Anglais'],
}

const SECTIONS: Section[] = ['Math', 'Science', 'Info', 'Technique', 'Lettre', 'Économie', 'Sport']

export default function BacFormPage({ nav }: Props) {
  const [section,  setSection]  = useState<Section>('Math')
  const [session,  setSession]  = useState('Principale')
  const [moyenne,  setMoyenne]  = useState('')
  const [notes,    setNotes]    = useState<Record<string, string>>({})
  const [errors,   setErrors]   = useState<Record<string, string>>({})

  const subjects = SUBJECTS[section]

  const setNote = (sub: string, val: string) => {
    setNotes(n => ({ ...n, [sub]: val }))
    setErrors(e => { const n = { ...e }; delete n[sub]; return n })
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}

    if (!moyenne.trim()) {
      e.moyenne = 'La moyenne générale est obligatoire.'
    } else {
      const v = parseFloat(moyenne)
      if (isNaN(v) || v < 0 || v > 20) e.moyenne = 'La valeur doit être entre 0 et 20.'
    }

    for (const sub of subjects) {
      const val = notes[sub]
      if (!val || val.trim() === '') {
        e[sub] = 'Obligatoire'
      } else {
        const v = parseFloat(val)
        if (isNaN(v) || v < 0 || v > 20) e[sub] = '0 – 20'
      }
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className={s.page}>
      <img src={bgForm} alt="" className={s.bgAbsolute} aria-hidden="true" />
      <div className={s.scroll}>
        <BrandHeader step="Étape 2 / 3" subtitle="Informations Bac" />

        <div className={s.sectionCard}>
          <p className={s.sectionTitle}>Section &amp; Session</p>
          <p className={s.sectionSub}>Sélectionnez votre section et session</p>
          <div className={s.inputGroup}>
            <div className={s.fieldWrap}>
              <label className={s.label}>Section</label>
              <select className={s.select} value={section}
                onChange={e => { setSection(e.target.value as Section); setNotes({}); setErrors({}) }}>
                {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>
            <div className={s.row2}>
              <div className={s.fieldWrap}>
                <label className={s.label}>Session</label>
                <select className={s.select} value={session} onChange={e => setSession(e.target.value)}>
                  <option>Principale</option>
                  <option>Contrôle</option>
                </select>
              </div>
              <div className={s.fieldWrap}>
                <label className={s.label}>Moyenne générale *</label>
                <input
                  className={`${s.input} ${errors.moyenne ? s.inputError : ''}`}
                  type="number" min="0" max="20" step="0.01" placeholder="Ex: 14.75"
                  value={moyenne}
                  onChange={e => { setMoyenne(e.target.value); setErrors(err => { const n = { ...err }; delete n.moyenne; return n }) }}
                />
                {errors.moyenne && <span className={s.errMsg}>{errors.moyenne}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className={s.sectionCard}>
          <p className={s.sectionTitle}>Notes par matière *</p>
          <p className={s.sectionSub}>Section : {section} — tous les champs requis</p>
          <div className={s.inputGroup}>
            <div className={s.row2}>
              {subjects.map(sub => (
                <div key={sub} className={s.fieldWrap}>
                  <label className={s.label}>{sub}</label>
                  <input
                    className={`${s.input} ${errors[sub] ? s.inputError : ''}`}
                    type="number" min="0" max="20" step="0.01" placeholder="/20"
                    value={notes[sub] ?? ''}
                    onChange={e => setNote(sub, e.target.value)}
                  />
                  {errors[sub] && <span className={s.errMsg}>{errors[sub]}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={s.navRow}>
          <button className={s.btnPrev} onClick={() => nav('register')}>Retour</button>
          <button className={s.btnNext} onClick={() => { if (validate()) nav('qcm') }}>Suivant</button>
        </div>
      </div>
      <p className={s.footer}>© 2026 Bideyety  | Tous droits réservés.</p>
    </div>
  )
}
