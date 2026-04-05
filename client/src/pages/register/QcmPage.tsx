import { useState } from 'react'
import type { Page } from '../../App'
import s from './StepLayout.module.css'
import BrandHeader from './BrandHeader'
import bgForm from '../../assets/bg-form.png'

interface Props { nav: (p: Page) => void }

interface QOption   { icon: string; label: string }
interface Question  { id: string; section: string; sub: string; options: QOption[]; multi: boolean }

const QUESTIONS: Question[] = [
  { id:'q1', section:"Centres d'intérêt",   sub:'Tu es plus attiré(e) par :',         multi:true,
    options:[{icon:'💻',label:'La technologie'},{icon:'🔬',label:'Les sciences'},{icon:'🤝',label:'Les relations humaines'},{icon:'🎨',label:"L'art et la créativité"}] },
  { id:'q2', section:'Matières préférées',  sub:'Tes matières préférées sont :',       multi:true,
    options:[{icon:'🧮',label:'Mathématiques'},{icon:'🔭',label:'Sciences (physique, SVT…)'},{icon:'🌐',label:'Langues'},{icon:'📊',label:'Économie / gestion'}] },
  { id:'q3', section:'Compétences',         sub:'Tu te considères plutôt :',           multi:true,
    options:[{icon:'🧩',label:'Logique'},{icon:'🎭',label:'Créatif(ve)'},{icon:'🤝',label:'Sociable'},{icon:'📋',label:'Organisé(e)'}] },
  { id:'q4', section:'Personnalité',        sub:'Tu préfères plutôt :',               multi:false,
    options:[{icon:'📏',label:'Suivre des règles'},{icon:'💡',label:'Innover et tester'},{icon:'🫂',label:'Aider les autres'},{icon:'👑',label:'Diriger une équipe'}] },
  { id:'q5', section:'Futur professionnel', sub:'Tu te vois travailler :',            multi:false,
    options:[{icon:'🏢',label:'Dans un bureau'},{icon:'🌳',label:'Sur le terrain'},{icon:'🏠',label:'À distance'},{icon:'✈️',label:'En déplacement'}] },
  { id:'q6', section:'Motivations',         sub:'Ce qui te motive le plus :',         multi:true,
    options:[{icon:'💰',label:'Argent'},{icon:'❤️',label:'Passion'},{icon:'🛡️',label:'Sécurité'},{icon:'🏆',label:'Reconnaissance'}] },
  { id:'q7', section:'Questions originales',sub:'Ton activité préférée le week-end :', multi:false,
    options:[{icon:'📺',label:'Regarder des vidéos / séries'},{icon:'📚',label:'Lire / apprendre'},{icon:'🎨',label:'Créer'},{icon:'🎮',label:'Jouer / expérimenter'}] },
  { id:'q8', section:'Questions originales',sub:'Ton environnement idéal :',          multi:false,
    options:[{icon:'🔇',label:'Calme et concentré'},{icon:'🎵',label:'Animé et dynamique'},{icon:'🌿',label:'Nature et extérieur'},{icon:'🏙️',label:'Ville et modernité'}] },
  { id:'q9', section:'Questions originales',sub:'Ton rôle idéal dans un groupe :',   multi:false,
    options:[{icon:'🎯',label:'Le stratège'},{icon:'🔧',label:"L'exécutant"},{icon:'💬',label:'Le communicant'},{icon:'🌟',label:'Le créatif'}] },
]

const SECTION_ORDER = ["Centres d'intérêt",'Matières préférées','Compétences','Personnalité','Futur professionnel','Motivations','Questions originales']

export default function QcmPage({ nav }: Props) {
  const [answers, setAnswers] = useState<Record<string, Set<string>>>(
    () => Object.fromEntries(QUESTIONS.map(q => [q.id, new Set<string>()]))
  )
  const [unanswered, setUnanswered] = useState<Set<string>>(new Set())
  const [globalError, setGlobalError] = useState('')

  const toggle = (qId: string, label: string, multi: boolean) => {
    setAnswers(prev => {
      const cur = new Set(prev[qId])
      if (multi) { cur.has(label) ? cur.delete(label) : cur.add(label) }
      else { cur.clear(); cur.add(label) }
      return { ...prev, [qId]: cur }
    })
    setUnanswered(prev => { const n = new Set(prev); n.delete(qId); return n })
    setGlobalError('')
  }

  const validate = (): boolean => {
    const empty = new Set<string>()
    QUESTIONS.forEach(q => { if (answers[q.id].size === 0) empty.add(q.id) })
    setUnanswered(empty)
    if (empty.size > 0) {
      setGlobalError(`Veuillez répondre à toutes les questions (${empty.size} réponse${empty.size > 1 ? 's' : ''} manquante${empty.size > 1 ? 's' : ''}).`)
      return false
    }
    return true
  }

  const grouped: Record<string, Question[]> = {}
  QUESTIONS.forEach(q => { (grouped[q.section] = grouped[q.section] ?? []).push(q) })

  return (
    <div className={s.page}>
      <img src={bgForm} alt="" className={s.bgAbsolute} aria-hidden="true" />
      <div className={s.scroll}>
        <BrandHeader step="Étape 3 / 3" subtitle={"Questionnaire d'orientation\nuniversitaire (QCM)"} />

        {globalError && (
          <div className={s.globalError}>⚠️ {globalError}</div>
        )}

        {SECTION_ORDER.map(secName => {
          const qs = grouped[secName]
          if (!qs) return null
          return (
            <div key={secName} className={s.sectionCard}>
              <p className={s.sectionTitle}>{secName}</p>
              {qs.map((q, qi) => (
                <div key={q.id} style={{ marginBottom: qi < qs.length - 1 ? 18 : 0 }}>
                  <p className={`${s.sectionSub} ${unanswered.has(q.id) ? s.sectionSubError : ''}`}>
                    {q.sub}
                    {unanswered.has(q.id) && <span className={s.reqBadge}> — Réponse requise</span>}
                  </p>
                  <div className={s.optionGrid}>
                    {q.options.map(opt => {
                      const sel = answers[q.id]?.has(opt.label) ?? false
                      return (
                        <button key={opt.label} type="button"
                          className={`${s.option} ${sel ? s.optionSelected : ''} ${unanswered.has(q.id) && !sel ? s.optionUnanswered : ''}`}
                          onClick={() => toggle(q.id, opt.label, q.multi)}>
                          <span className={`${s.checkbox} ${sel ? s.checkboxChecked : ''}`}>
                            {sel && (
                              <svg viewBox="0 0 10 8" width="8" height="8">
                                <polyline points="1,4 4,7 9,1" stroke="white" strokeWidth="1.8"
                                  fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          <span className={s.optionIcon}>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        <div className={s.navRow}>
          <button className={s.btnPrev} onClick={() => nav('bac')}>Retour</button>
          <button className={s.btnNext} onClick={() => { if (validate()) nav('home') }}>Terminer</button>
        </div>
      </div>
      <p className={s.footer}>© 2026 Bideyety  | Tous droits réservés.</p>
    </div>
  )
}
