import { useEffect, useMemo, useRef, useState } from 'react'
import type { Page } from '../App'
import { aiApi, isAxiosApiError, type AiSpecialityOverviewResponse } from '../api/aiApi'
import { useAuth } from '../context/AuthContext'
import type { SpecialiteDetail } from '../api/specialiteApi'
import { specialiteApi } from '../api/specialiteApi'
import {
  statistiquesAdmissionApi,
  capacitesAdmissionApi,
  type StatistiqueAdmissionRow,
  type CapaciteAdmissionRow,
} from '../api/admissionApi'
import BideyetiLogo from '../components/BideyetiLogo'
import AiOverviewAnimatedContent from '../components/AiOverviewAnimatedContent'
import EducationLoader from '../components/EducationLoader'
import AdmissionRatePage from '../components/AdmissionRatePage'
import { calculateT, SECTION_MAP } from '../utils/ScoreUtils'
import s from './SpecialiteDetailPage.module.css'

const YEARS = [2023, 2024, 2025] as const
const AI_MIN_LOADING_MS = 1400

type DetailTab = 'admission' | 'ai'

type AiPanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: AiSpecialityOverviewResponse }
  | { status: 'auth'; message: string }
  | { status: 'incomplete'; message: string }
  | { status: 'error'; message: string }

interface Props {
  nav: (
    p: Page,
    regionId?: string,
    facultyId?: string,
    specialiteId?: string
  ) => void
  specialiteId?: string
  facultyId?: string
}

export default function SpecialiteDetailPage({
  nav,
  specialiteId,
  facultyId,
}: Props) {
  const { user } = useAuth()
  const [year, setYear] = useState<number>(2025)
  const [activeTab, setActiveTab] = useState<DetailTab>('admission')
  const [specialite, setSpecialite] = useState<SpecialiteDetail | null>(null)
  const [stats, setStats] = useState<StatistiqueAdmissionRow[]>([])
  const [caps, setCaps] = useState<CapaciteAdmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiPanelState, setAiPanelState] = useState<AiPanelState>({ status: 'idle' })
  const [aiReplayKey, setAiReplayKey] = useState(0)
  const aiOverviewCacheRef = useRef<Record<string, AiSpecialityOverviewResponse>>({})

  useEffect(() => {
    if (!specialiteId) {
      setLoading(false)
      setSpecialite(null)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [sp, st, cp] = await Promise.all([
          specialiteApi.getById(specialiteId),
          statistiquesAdmissionApi.getBySpecialite(specialiteId),
          capacitesAdmissionApi.getBySpecialite(specialiteId),
        ])
        if (cancelled) return
        setSpecialite(sp)
        setStats(st)
        setCaps(cp)
      } catch {
        if (!cancelled) {
          setSpecialite(null)
          setError('Impossible de charger cette specialite.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [specialiteId])

  useEffect(() => {
    if (!specialiteId || activeTab !== 'ai') {
      return
    }

    const cacheKey = `${specialiteId}:${year}`
    const cachedOverview = aiOverviewCacheRef.current[cacheKey]

    let cancelled = false
    const timers: number[] = []

    const finishWithDelay = <T extends AiPanelState>(nextState: T) => {
      const timer = window.setTimeout(() => {
        if (cancelled) return
        setAiPanelState(nextState)
        if (nextState.status === 'success') {
          setAiReplayKey((current) => current + 1)
        }
      }, AI_MIN_LOADING_MS)

      timers.push(timer)
    }

    if (cachedOverview) {
      setAiPanelState({ status: 'loading' })
      finishWithDelay({ status: 'success', data: cachedOverview })
      return () => {
        cancelled = true
        timers.forEach((timer) => window.clearTimeout(timer))
      }
    }

    if (!user) {
      setAiPanelState({
        status: 'auth',
        message: "Connectez-vous pour obtenir une lecture IA personnalisee de cette specialite.",
      })
      return
    }

    setAiPanelState({ status: 'loading' })

    ;(async () => {
      const startedAt = Date.now()

      try {
        const overview = await aiApi.getSpecialityOverview({
          specialiteId,
          year,
        })

        aiOverviewCacheRef.current[cacheKey] = overview

        const remainingDelay = Math.max(
          AI_MIN_LOADING_MS - (Date.now() - startedAt),
          0
        )

        const timer = window.setTimeout(() => {
          if (cancelled) return
          setAiPanelState({ status: 'success', data: overview })
          setAiReplayKey((current) => current + 1)
        }, remainingDelay)

        timers.push(timer)
      } catch (requestError) {
        const remainingDelay = Math.max(
          AI_MIN_LOADING_MS - (Date.now() - startedAt),
          0
        )

        const nextState = resolveAiErrorState(requestError)
        const timer = window.setTimeout(() => {
          if (cancelled) return
          setAiPanelState(nextState)
        }, remainingDelay)

        timers.push(timer)
      }
    })()

    return () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [activeTab, specialiteId, user, year])

  const statsForYear = useMemo(
    () => stats.filter((r) => r.annee === year),
    [stats, year]
  )

  const capsForYear = useMemo(
    () => caps.filter((r) => r.annee === year),
    [caps, year]
  )

  const sortedCaps = useMemo(() => {
    return [...capsForYear].sort((a, b) => {
      const sa = a.section?.nom ?? ''
      const sb = b.section?.nom ?? ''
      if (sa !== sb) return sa.localeCompare(sb, 'fr')
      return a.tour.localeCompare(b.tour, 'fr')
    })
  }, [capsForYear])

  const facultyHistoryForUser = useMemo(() => {
    if (!specialite || !stats.length) return null;
    const sectionNom = user?.section?.nom || "Indéfini";
    
    // Get stats specifically for the user's section (or fallback to all if they don't have one? No, filter by section)
    const userSectionStats = stats.filter(st => st.section?.nom === sectionNom);
    if (!userSectionStats.length) return null;

    return {
      facultyId: specialite.etablissement?.id ?? "",
      facultyName: specialite.etablissement?.nom ?? specialite.universite?.nom ?? "Établissement",
      years: userSectionStats.map(s => ({
        year: s.annee,
        minScore: s.scoreDernierAdmis,
        admissionRate: s.tauxAdmission ?? 85, // Fallback if no admission rate is in DB
        totalApplicants: 0,
        admitted: 0,
      }))
    };
  }, [specialite, stats, user]);

  const backToEtablissement = () => {
    if (facultyId) nav('faculty-detail', undefined, facultyId)
    else nav(user ? 'university' : 'visitor')
  }

  const renderAiPanel = () => {
    if (aiPanelState.status === 'idle' || aiPanelState.status === 'loading') {
      return (
        <section className={s.aiLoadingCard} aria-live="polite">
          <div className={s.aiLoadingVisual}>
            <EducationLoader
              compact
              label="L'assistant IA prepare votre lecture"
              caption="Synthese du profil, du contexte de la specialite et des admissions utiles."
            />
          </div>
          <div className={s.aiSkeletonGroup} aria-hidden="true">
            <div className={s.aiSkeletonHero} />
            <div className={s.aiSkeletonLineLong} />
            <div className={s.aiSkeletonLineMedium} />
            <div className={s.aiSkeletonGrid}>
              <span className={s.aiSkeletonPill} />
              <span className={s.aiSkeletonPill} />
              <span className={s.aiSkeletonPill} />
            </div>
            <div className={s.aiSkeletonPanel} />
            <div className={s.aiSkeletonPanel} />
          </div>
        </section>
      )
    }

    if (aiPanelState.status === 'success') {
      return (
        <AiOverviewAnimatedContent
          overview={aiPanelState.data}
          replayKey={aiReplayKey}
        />
      )
    }

    return (
      <section className={s.aiMessageCard}>
        <span className={s.aiMessageEyebrow}>Analyse IA</span>
        <h3 className={s.aiMessageTitle}>
          {aiPanelState.status === 'auth'
            ? 'Connexion requise'
            : aiPanelState.status === 'incomplete'
              ? 'Profil a completer'
              : "Analyse temporairement indisponible"}
        </h3>
        <p className={s.aiMessageBody}>{aiPanelState.message}</p>
      </section>
    )
  }

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.loading}>
          <EducationLoader
            label="Chargement de la specialite"
            caption="Preparation des admissions, capacites et informations utiles."
          />
        </div>
      </div>
    )
  }

  if (!specialiteId || error || !specialite) {
    return (
      <div className={s.page}>
        <div className={s.error}>
          <h2>Specialite non trouvee</h2>
          <p>{error || 'Cette specialite est introuvable.'}</p>
          <button type="button" className={s.backBtn} onClick={backToEtablissement}>
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <button type="button" className={s.backBtn} onClick={backToEtablissement}>
            Retour a l'etablissement
          </button>
          <div className={s.logo}>
            <BideyetiLogo />
          </div>
        </div>
      </header>

      <main className={s.main}>
        <section className={s.hero}>
          <h1 className={s.title}>{specialite.nom}</h1>
          <p className={s.code}>Code orientation : {specialite.codeOrientation}</p>
          {specialite.domaine && (
            <span className={s.badge}>{specialite.domaine}</span>
          )}
          {specialite.formuleBrute && (
            <p className={s.desc}>{specialite.formuleBrute}</p>
          )}
        </section>

        <section className={s.card}>
          <div className={s.controlHeader}>
            <div>
              <h2 className={s.cardTitle}>Explorer cette specialite</h2>
              <p className={s.cardHint}>
                Alternez entre les donnees d'admission et la lecture IA sans quitter la page.
              </p>
            </div>
            <div className={s.tabRow} role="tablist" aria-label="Vue detaillee">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'admission'}
                className={`${s.tabButton} ${
                  activeTab === 'admission' ? s.tabButtonActive : ''
                }`}
                onClick={() => setActiveTab('admission')}
              >
                Admission
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'ai'}
                className={`${s.tabButton} ${activeTab === 'ai' ? s.tabButtonActive : ''}`}
                onClick={() => setActiveTab('ai')}
              >
                Analyse IA
              </button>
            </div>
          </div>

          <div className={s.yearRow} role="tablist" aria-label="Annee">
            {YEARS.map((y) => (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={year === y}
                className={`${s.yearPill} ${year === y ? s.yearPillActive : ''}`}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'admission' ? (
          <>
            <section className={s.card}>
              <h2 className={s.cardTitle}>Dernier admis ({year})</h2>
              {statsForYear.length === 0 ? (
                <p className={s.empty}>Aucune statistique d'admission pour cette annee.</p>
              ) : (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Section Bac</th>
                        <th>Dernier admis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsForYear.map((row) => (
                        <tr key={row.id}>
                          <td>{row.section?.nom ?? '-'}</td>
                          <td>{row.scoreDernierAdmis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className={s.card}>
              <h2 className={s.cardTitle}>Capacites par section Bac ({year})</h2>
              {sortedCaps.length === 0 ? (
                <p className={s.empty}>Aucune capacite enregistree pour cette annee.</p>
              ) : (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Section Bac</th>
                        <th>Tour</th>
                        <th>Capacite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCaps.map((row) => (
                        <tr key={row.id}>
                          <td>{row.section?.nom ?? '-'}</td>
                          <td>{row.tour}</td>
                          <td>{row.capacite}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {user?.studentProfile?.score && user?.section?.nom && facultyHistoryForUser && (() => {
              const normalize = (val: string | null | undefined) => 
                val ? val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : '';
              
              const uReg = normalize((user.studentProfile as any).region);
              const fReg = normalize(specialite.etablissement?.gouvernorat ?? (specialite.universite as any)?.region);
              
              const hasBonus = Boolean(uReg && fReg && uReg === fReg);
              
              const sectionRaw = user.section.nom;
              const sectionKey = SECTION_MAP[sectionRaw] ?? 'Math';
              
              const noteMap: Record<string, string> = {};
              if (user.notes) {
                user.notes.forEach((n: any) => { noteMap[n.matiereNom] = String(n.valeur); });
              }

              // Use calculateT instead of the base FG score for university-specific scores
              const baseScore = calculateT(user.studentProfile.score, specialite.nom, sectionKey, noteMap);
              const boostedScore = hasBonus ? +(baseScore * 1.07).toFixed(3) : baseScore;

              return (
                <section className={s.card} style={{ marginTop: 24 }}>
                  <AdmissionRatePage
                    studentScore={{
                      studentId: user.id || "0",
                      baseScore: baseScore,
                      totalScore: boostedScore,
                      subject: user.section.nom,
                      hasRegionBonus: hasBonus
                    }}
                    facultyHistory={facultyHistoryForUser}
                    currentYear={year}
                  />
                </section>
              )
            })()}
          </>
        ) : (
          renderAiPanel()
        )}
      </main>

      <footer className={s.footer}>
        <p>(c) 2026 Bideyety | Tous droits reserves.</p>
      </footer>
    </div>
  )
}

function resolveAiErrorState(error: unknown): AiPanelState {
  if (isAxiosApiError(error)) {
    const status = error.response?.status
    const data = error.response?.data

    if (import.meta.env.DEV) {
      console.error('[AI Overview] request failed', {
        status,
        data,
      })
    }

    if (status === 401) {
      return {
        status: 'auth',
        message: "Connectez-vous pour obtenir une lecture IA personnalisee de cette specialite.",
      }
    }

    if (status === 409) {
      return {
        status: 'incomplete',
        message:
          "Ajoutez votre section du bac et votre moyenne pour recevoir un avis IA personnalise.",
      }
    }

    return {
      status: 'error',
      message: "L'analyse IA est temporairement indisponible. Reessayez dans quelques instants.",
    }
  }

  return {
    status: 'error',
    message: "Une erreur inattendue a interrompu l'analyse IA. Reessayez dans quelques instants.",
  }
}
