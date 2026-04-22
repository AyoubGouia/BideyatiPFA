import { useState } from 'react'
import type { Page } from '../../App'
import { useRegistration } from '../../context/RegistrationContext'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
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
  const { data, clearData } = useRegistration();
  const { refreshUser } = useAuth();

  const [answers, setAnswers] = useState<Record<string, Set<string>>>(
    () => {
      if (data.answers) return data.answers;
      return Object.fromEntries(QUESTIONS.map(q => [q.id, new Set<string>()]))
    }
  )
  const [unanswered, setUnanswered] = useState<Set<string>>(new Set())
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
    QUESTIONS.forEach(q => { if (!answers[q.id] || answers[q.id].size === 0) empty.add(q.id) })
    setUnanswered(empty)
    if (empty.size > 0) {
      setGlobalError(`Veuillez répondre à toutes les questions (${empty.size} réponse${empty.size > 1 ? 's' : ''} manquante${empty.size > 1 ? 's' : ''}).`)
      return false
    }
    return true
  }

  const handleTerminer = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setGlobalError('');

    try {
      // Step 1: Register user (sets httpOnly cookie, does NOT update React state yet)
      console.log('[QcmPage] Step 1: Registering user...');
      const registrationPayload = {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: '00000000',
        motDePasse: data.pwd,
        numeroBAC: data.numeroBAC,
        moyenneBac: parseFloat(data.moyenneBac || '0'),
        score: data.score ? parseFloat(data.score.toString()) : undefined,
        region: data.region,
        section: data.section || 'Math'
      };
      await authApi.register(registrationPayload);
      console.log('[QcmPage] Step 1: Registration successful (cookie set, state not yet updated)');

      // Step 2: Format questionnaire answers
      const formattedReponses = QUESTIONS.map(q => {
        const reps = Array.from(answers[q.id] || new Set());
        return reps.map(r => ({ question: q.sub, reponse: r }));
      }).flat();

      // Step 3: Format notes — pick the best grade per subject between sessions
      const notesP = data.notesPrincipale || {};
      const notesC = data.notesControle || {};
      const allSubjects = Array.from(new Set([...Object.keys(notesP), ...Object.keys(notesC)]));
      const formattedNotes = allSubjects
        .map(sub => {
          const valP = parseFloat(notesP[sub] || '0');
          const valC = parseFloat(notesC[sub] || '0');
          // Official Contrôle formula: (2 × Main + Retake) / 3
          // Non-rattrapable subjects (Option, Éducation Physique) keep the main session grade
          const isNonRattrapable = sub === 'Option' || sub === 'Éducation Physique';
          const effectiveVal =
            data.session === 'Contrôle' && notesC[sub] && !isNonRattrapable
              ? (2 * valP + valC) / 3
              : valP;
          return { valeur: effectiveVal, annee: new Date().getFullYear(), matiereNom: sub };
        })
        .filter(n => !isNaN(n.valeur)); // skip any malformed entries

      console.log('[QcmPage] Step 2: Submitting questionnaire + notes...', { reponses: formattedReponses.length, notes: formattedNotes.length });

      // Step 4: Submit questionnaire & notes while still on QCM page
      await authApi.submitQuestionnaire({ reponses: formattedReponses, notes: formattedNotes });
      console.log('[QcmPage] Step 4: Questionnaire + notes saved successfully');

      // Step 5: NOW update React state — this triggers the redirect to 'university'
      clearData();
      await refreshUser();
      nav('university');
    } catch (err: any) {
      console.error('[QcmPage] Error during registration flow:', err);
      setGlobalError(err.response?.data?.error || 'Une erreur est survenue lors de l\'enregistrement.');
      setIsLoading(false);
    }
  };

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
          <button className={s.btnPrev} onClick={() => nav('bac')} disabled={isLoading}>Retour</button>
          <button className={s.btnNext} onClick={handleTerminer} disabled={isLoading}>
            {isLoading ? 'Chargement...' : 'Terminer'}
          </button>
        </div>
      </div>
      <p className={s.footer}>© 2026 Bideyety  | Tous droits réservés.</p>
    </div>
  )
}
