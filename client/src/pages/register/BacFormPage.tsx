import { useState, useMemo, useEffect } from 'react'
import type { Page } from '../../App'
import { useRegistration } from '../../context/RegistrationContext'
import { calculateMG, calculateFG, Section } from '../../utils/ScoreUtils'
import s from './StepLayout.module.css'
import BrandHeader from './BrandHeader'
import bgForm from '../../assets/bg-form.png'

interface Props { nav: (p: Page) => void }

const SUBJECTS: Record<Section, string[]> = {
  Math:      ['Mathématiques', 'Sciences Physiques', 'SVT', 'Philosophie', 'Arabe', 'Français', 'Anglais', 'Informatique', 'Éducation Physique', 'Option'],
  Science:   ['SVT', 'Sciences Physiques', 'Mathématiques', 'Philosophie', 'Arabe', 'Français', 'Anglais', 'Informatique', 'Éducation Physique', 'Option'],
  Info:      ['Algorithmique & Programmation', 'Systèmes & T.I.', 'Mathématiques', 'Sciences Physiques', 'Philosophie', 'Arabe', 'Français', 'Anglais', 'Éducation Physique', 'Option'],
  Technique: ['Technologie', 'Sciences Physiques', 'Mathématiques', 'Philosophie', 'Arabe', 'Français', 'Anglais', 'Informatique', 'Éducation Physique', 'Option'],
  Lettre:    ['Arabe', 'Philosophie', 'Français', 'Anglais', 'Histoire-Géo', 'Informatique', 'Éducation Physique', 'Option'],
  Économie:  ['Économie', 'Gestion', 'Mathématiques', 'Histoire-Géo', 'Philosophie', 'Arabe', 'Français', 'Anglais', 'Informatique', 'Éducation Physique', 'Option'],
  Sport:     ['Sciences Biologiques', 'Discipline Sportive', 'Sciences Physiques', 'Mathématiques', 'Philosophie', 'Arabe', 'Français', 'Anglais', 'Informatique', 'Option'],
}

const CHOICE_SUBJECTS: Partial<Record<Section, [string, string]>> = {
  Info: ['Systèmes & T.I.', 'Sciences Physiques'],
  Économie: ['Mathématiques', 'Histoire-Géo'],
  Sport: ['Mathématiques', 'Sciences Physiques'],
}

const SECTIONS: Section[] = ['Math', 'Science', 'Info', 'Technique', 'Lettre', 'Économie', 'Sport']
const REGIONS = ['Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan']

export default function BacFormPage({ nav }: Props) {
  const { data, updateData } = useRegistration();

  const [section, setSection] = useState<Section>((data.section as Section) || 'Math')
  const [session, setSession] = useState<'Principale' | 'Contrôle'>(data.session || 'Principale')
  const [region, setRegion] = useState(data.region || '')
  
  const [notesP, setNotesP] = useState<Record<string, string>>(data.notesPrincipale || {})
  const [notesC, setNotesC] = useState<Record<string, string>>(data.notesControle || {})
  const [rattrapageChoice, setRattrapageChoice] = useState<string | null>(data.selectedRattrapage || null)

  const [exemptSport, setExemptSport] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const subjects = SUBJECTS[section]
  const sectionChoices = CHOICE_SUBJECTS[section]

  const mg = useMemo(() => calculateMG(section, notesP, notesC, session), [section, notesP, notesC, session])
  const fg = useMemo(() => calculateFG(section, mg, notesP, notesC, session), [section, mg, notesP, notesC, session])

  const setNoteP = (sub: string, val: string) => {
    setNotesP(n => ({ ...n, [sub]: val }))
    setErrors(e => { const n = { ...e }; delete n[sub + '_P']; return n })
  }

  const setNoteC = (sub: string, val: string) => {
    setNotesC(n => ({ ...n, [sub]: val }))
    setErrors(e => { const n = { ...e }; delete n[sub + '_C']; return n })
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!region) e.region = 'La région est obligatoire.'

    // Validate Principale
    for (const sub of subjects) {
      if (sub === 'Option') continue
      if (sub === 'Éducation Physique' && exemptSport) continue
      const val = notesP[sub]
      if (!val || val.trim() === '') e[sub + '_P'] = 'Requis'
      else {
        const v = parseFloat(val)
        if (isNaN(v) || v < 0 || v > 20) e[sub + '_P'] = '0-20'
      }
    }

    if (session === 'Contrôle') {
      if (sectionChoices && !rattrapageChoice) e.rattrapage = 'Veuillez choisir une matière.'
      for (const sub of subjects) {
        if (sub === 'Option' || sub === 'Éducation Physique') continue
        const valC = notesC[sub]
        if (valC && valC.trim() !== '') {
          const v = parseFloat(valC)
          if (isNaN(v) || v < 0 || v > 20) e[sub + '_C'] = '0-20'
        }
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
          <p className={s.sectionTitle}>Section & Session</p>
          <div className={s.inputGroup} style={{ marginTop: '10px' }}>
            <div className={s.row2}>
              <div className={s.fieldWrap}>
                <label className={s.label}>Section</label>
                <select className={s.select} value={section}
                  onChange={e => { 
                    setSection(e.target.value as Section); 
                    setNotesP({}); setNotesC({}); setRattrapageChoice(null); setErrors({}) 
                  }}>
                  {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>
              <div className={s.fieldWrap}>
                <label className={s.label}>Session</label>
                <select className={s.select} value={session} onChange={e => setSession(e.target.value as any)}>
                  <option value="Principale">Principale</option>
                  <option value="Contrôle">Contrôle</option>
                </select>
              </div>
            </div>
            <div className={s.fieldWrap}>
              <label className={s.label}>Région *</label>
              <select className={`${s.select} ${errors.region ? s.inputError : ''}`} value={region} onChange={e => setRegion(e.target.value)}>
                <option value="">Sélectionnez votre région</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.region && <span className={s.errMsg}>{errors.region}</span>}
            </div>
          </div>
        </div>

        <div className={s.sectionCard}>
          <p className={s.sectionTitle}>Notes : Session Principale</p>
          <p className={s.sectionSub}>Saisissez vos notes officielles de la session principale</p>
          <div className={s.inputGroup}>
            <div className={s.row2}>
              {subjects.map(sub => (
                <div key={sub} className={s.fieldWrap}>
                  <label className={s.label}>{sub}</label>
                  <input className={`${s.input} ${errors[sub + '_P'] ? s.inputError : ''}`} type="number" step="0.01" value={notesP[sub] || ''} 
                    disabled={sub === 'Éducation Physique' && exemptSport} onChange={e => setNoteP(sub, e.target.value)} />
                  {sub === 'Éducation Physique' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '11px', color: '#666', cursor: 'pointer' }}>
                      <input type="checkbox" checked={exemptSport} onChange={e => { setExemptSport(e.target.checked); if (e.target.checked) setNoteP(sub, '') }} /> Dispensé(e)
                    </label>
                  )}
                  {errors[sub + '_P'] && <span className={s.errMsg}>{errors[sub + '_P']}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {session === 'Contrôle' && (
          <div className={s.sectionCard} style={{ border: '2px solid #F47920', background: '#fffcf9' }}>
            <p className={s.sectionTitle} style={{ color: '#F47920' }}>Notes : Session de Contrôle</p>
            <p className={s.sectionSub}>Seules les matières rattrapables sont affichées</p>

            {sectionChoices && (
              <div style={{ marginBottom: '16px' }}>
                <p className={s.label} style={{ marginBottom: '8px' }}>Matière à rattraper (Choix obligatoire) :</p>
                <div className={s.optionGrid}>
                  {sectionChoices.map(c => (
                    <div key={c} className={`${s.option} ${rattrapageChoice === c ? s.optionSelected : ''}`} onClick={() => setRattrapageChoice(c)}>
                      <div className={`${s.checkbox} ${rattrapageChoice === c ? s.checkboxChecked : ''}`}>
                        {rattrapageChoice === c && <svg className={s.checkmark} viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
                      </div>
                      {c}
                    </div>
                  ))}
                </div>
                {errors.rattrapage && <p className={s.errMsg}>{errors.rattrapage}</p>}
              </div>
            )}

            <div className={s.inputGroup}>
              <div className={s.row2}>
                {subjects.filter(sub => {
                  if (sub === 'Option' || sub === 'Éducation Physique') return false
                  if (sectionChoices) {
                    const otherChoice = sectionChoices.find(o => o !== rattrapageChoice)
                    if (sub === otherChoice) return false 
                  }
                  return true
                }).map(sub => (
                  <div key={sub} className={s.fieldWrap}>
                    <label className={s.label}>{sub}</label>
                    <input className={`${s.input} ${errors[sub + '_C'] ? s.inputError : ''}`} type="number" step="0.01" 
                      placeholder="Note rattrapage" value={notesC[sub] || ''} onChange={e => setNoteC(sub, e.target.value)} />
                    {errors[sub + '_C'] && <span className={s.errMsg}>{errors[sub + '_C']}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={s.dashboard}>
          <div className={s.dashboardTitle}>Résultats {session === 'Contrôle' ? 'Session Contrôle' : 'Session Principale'}</div>
          <div className={s.statGrid}>
            <div className={s.statBox}>
              <span className={s.statLabel}>MOYENNE GÉNÉRALE</span>
              <span className={`${s.statValue} ${s.statValueOrange}`}>{mg.toFixed(3)}</span>
            </div>
            <div className={s.statBox}>
              <span className={s.statLabel}>SCORE FINAL</span>
              <span className={`${s.statValue} ${s.statValueGreen}`}>{fg.toFixed(2)}</span>
            </div>
          </div>
          <p className={s.dashboardFooter}>Calculé selon la formule : {session === 'Contrôle' ? 'MG_c (Max P/C)' : 'MG_principale'}.</p>
        </div>

        <div className={s.navRow}>
          <button className={s.btnPrev} onClick={() => nav('register')}>Retour</button>
          <button className={s.btnNext} onClick={() => {
            if (validate()) {
              updateData({
                section, session, region,
                notesPrincipale: notesP,
                notesControle: notesC,
                selectedRattrapage: rattrapageChoice || undefined,
                moyenneBac: mg.toFixed(3),
                score: fg
              })
              nav('qcm')
            }
          }}>Suivant</button>
        </div>
      </div>
      <p className={s.footer}>© 2026 Bideyety | Tous droits réservés.</p>
    </div>
  )
}
