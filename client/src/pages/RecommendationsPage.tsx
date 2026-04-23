import { useEffect, useState } from 'react'
import type { Page } from '../App'
import { recommendationApi, type MetierRecommandation } from '../api/recommendationApi'
import s from './RecommendationsPage.module.css'

interface Props {
  nav: (p: Page) => void
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#6FBF4A' // Leaf green
  if (score >= 45) return '#A9C7DB' // Sky bleu
  return '#A9C7DB'
}

function getRankClass(rank: number, styles: typeof s): string {
  if (rank === 1) return styles.rankGold
  if (rank === 2) return styles.rankSilver
  if (rank === 3) return styles.rankBronze
  return styles.rankDefault
}

function ScoreRing({ score }: { score: number }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = getScoreColor(score)

  return (
    <div className={s.scoreRing}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div className={s.scoreValue} style={{ color }}>{score}%</div>
    </div>
  )
}

export default function RecommendationsPage({ nav }: Props) {
  const [data, setData] = useState<MetierRecommandation[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    recommendationApi.getMetierRecommandations()
      .then(setData)
      .catch(err => {
        const msg = err?.response?.status === 409
          ? "Complétez votre questionnaire pour obtenir des recommandations personnalisées."
          : "Impossible de charger les recommandations."
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={s.page}>
      <header className={s.header}>
        <button className={s.backBtn} onClick={() => nav('university')}>
          ← Retour
        </button>
      </header>

      <section className={s.hero}>
        <div className={s.heroEyebrow}>✨ Personnalisé pour vous</div>
        <h1 className={s.heroTitle}>Vos Métiers Recommandés</h1>
        <p className={s.heroSub}>
          Basé sur vos centres d'intérêt, vos compétences et votre profil académique,
          voici les débouchés professionnels qui vous correspondent le mieux.
        </p>
      </section>

      {loading && (
        <div className={s.centerState}>
          <div className={s.spinner} />
          <span>Calcul de vos recommandations…</span>
        </div>
      )}

      {!loading && error && (
        <div className={s.centerState}>
          <span style={{ fontSize: 32 }}>🔍</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && data && data.length === 0 && (
        <div className={s.centerState}>
          <span style={{ fontSize: 32 }}>🤔</span>
          <span>Aucune recommandation disponible pour le moment.</span>
        </div>
      )}

      {!loading && data && data.length > 0 && (
        <div className={s.grid}>
          {data.map((m, i) => {
            const rank = i + 1
            const color = getScoreColor(m.matchScore)
            return (
              <div key={m.id} className={s.card}>
                <div className={s.cardTop}>
                  <div className={s.cardLeft}>
                    <div className={`${s.rank} ${getRankClass(rank, s)}`}>
                      {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : `#${rank}`}
                    </div>
                    <div className={s.cardInfo}>
                      <div className={s.cardTitle}>{m.titre}</div>
                      <span className={s.secteurBadge}>{m.secteur}</span>
                    </div>
                  </div>
                  <ScoreRing score={m.matchScore} />
                </div>

                {/* Progress bar */}
                <div className={s.scoreBarWrap}>
                  <div className={s.scoreBarLabel}>
                    <span>Compatibilité</span>
                    <span style={{ color, fontWeight: 700 }}>{m.matchScore}%</span>
                  </div>
                  <div className={s.scoreBarTrack}>
                    <div
                      className={s.scoreBarFill}
                      style={{
                        width: `${m.matchScore}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                      }}
                    />
                  </div>
                </div>

                {/* Matched tags */}
                {m.matchedTags.length > 0 && (
                  <div className={s.tagsSection}>
                    <div className={s.tagsSectionLabel}>Pourquoi ce métier ?</div>
                    <div className={s.tagsList}>
                      {m.matchedTags.map(tag => (
                        <span key={tag} className={s.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked specialites */}
                {m.linkedSpecialites.length > 0 && (
                  <div className={s.specsSection}>
                    <div className={s.specsSectionLabel}>Spécialités liées</div>
                    <div className={s.specsList}>
                      {m.linkedSpecialites.slice(0, 5).map(sp => (
                        <span key={sp.id} className={s.specChip} title={sp.nom}>
                          {sp.nom}
                        </span>
                      ))}
                      {m.linkedSpecialites.length > 5 && (
                        <span className={s.specChip}>+{m.linkedSpecialites.length - 5} autres</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
