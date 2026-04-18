import type { AiSpecialityOverviewResponse } from '../api/aiApi'
import TypingText from './TypingText'
import s from './AiOverviewAnimatedContent.module.css'

interface Props {
  overview: AiSpecialityOverviewResponse
  replayKey: number
}

const WORD_STEP_MS = 68
const SECTION_GAP_MS = 260

const estimateDuration = (text: string) => {
  const wordCount = text.split(/\s+/).map((word) => word.trim()).filter(Boolean).length
  return wordCount * WORD_STEP_MS + SECTION_GAP_MS
}

const labelMap: Record<AiSpecialityOverviewResponse['analysis']['label'], string> = {
  safe: 'Safe',
  balanced: 'Balanced',
  ambitious: 'Ambitious',
  risky: 'Risky',
}

const confidenceMap: Record<
  AiSpecialityOverviewResponse['analysis']['confidence'],
  string
> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Elevee',
}

export default function AiOverviewAnimatedContent({
  overview,
  replayKey,
}: Props) {
  const { analysis, completeness, yearRequested, yearUsed } = overview
  const strengths = withFallback(
    analysis.strengths,
    "Aucun point fort detaille n'a ete fourni par l'assistant."
  )
  const risks = withFallback(
    analysis.risks,
    "Aucun risque detaille n'a ete fourni par l'assistant."
  )
  const advice = withFallback(
    analysis.advice,
    "Aucun conseil supplementaire n'a ete fourni par l'assistant."
  )
  let currentDelay = 220

  const summaryDelay = currentDelay
  currentDelay += estimateDuration(analysis.summary)

  const strengthsDelays = strengths.map((item) => {
    const delay = currentDelay
    currentDelay += estimateDuration(item)
    return delay
  })

  const risksDelays = risks.map((item) => {
    const delay = currentDelay
    currentDelay += estimateDuration(item)
    return delay
  })

  const adviceDelays = advice.map((item) => {
    const delay = currentDelay
    currentDelay += estimateDuration(item)
    return delay
  })

  const disclaimerDelay = currentDelay

  return (
    <div className={s.shell}>
      <div className={s.hero}>
        <div className={s.heroTop}>
          <div className={s.aiBadge}>AI Overview</div>
          <div className={`${s.labelBadge} ${s[`label${labelMap[analysis.label]}`]}`}>
            {labelMap[analysis.label]}
          </div>
        </div>
        <div className={s.heroMeta}>
          <div className={s.metaPill}>
            <span className={s.metaLabel}>Confiance</span>
            <strong>{confidenceMap[analysis.confidence]}</strong>
          </div>
          <div className={s.metaPill}>
            <span className={s.metaLabel}>Annee analysee</span>
            <strong>{yearUsed ?? yearRequested ?? 'Non precisee'}</strong>
          </div>
        </div>

        <TypingText
          text={analysis.summary}
          replayKey={replayKey}
          startDelayMs={summaryDelay}
          stepMs={WORD_STEP_MS}
          className={s.summary}
        />
      </div>

      <div className={s.completenessGrid}>
        <div className={s.completenessItem}>
          <span>Section bac</span>
          <strong>{completeness.hasSection ? 'OK' : 'Manquante'}</strong>
        </div>
        <div className={s.completenessItem}>
          <span>Moyenne</span>
          <strong>{completeness.hasMoyenne ? 'OK' : 'Manquante'}</strong>
        </div>
        <div className={s.completenessItem}>
          <span>Notes</span>
          <strong>{completeness.hasNotes ? 'Disponibles' : 'Absentes'}</strong>
        </div>
        <div className={s.completenessItem}>
          <span>Questionnaire</span>
          <strong>{completeness.hasQuestionnaire ? 'Disponible' : 'Absent'}</strong>
        </div>
        <div className={s.completenessItem}>
          <span>Dernier admis</span>
          <strong>{completeness.hasHistoricalScore ? 'Disponible' : 'Absent'}</strong>
        </div>
        <div className={s.completenessItem}>
          <span>Capacite</span>
          <strong>{completeness.hasCapacity ? 'Disponible' : 'Absente'}</strong>
        </div>
      </div>

      <div className={s.sectionGrid}>
        <section className={s.sectionCard}>
          <h3 className={s.sectionTitle}>Points forts</h3>
          <ul className={s.pointList}>
            {strengths.map((item, index) => (
              <li key={`strength-${index}`} className={s.pointItem}>
                <span className={s.pointDot} aria-hidden="true" />
                <TypingText
                  text={item}
                  replayKey={replayKey}
                  startDelayMs={strengthsDelays[index]}
                  stepMs={WORD_STEP_MS}
                  className={s.pointText}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className={s.sectionCard}>
          <h3 className={s.sectionTitle}>Points d'attention</h3>
          <ul className={s.pointList}>
            {risks.map((item, index) => (
              <li key={`risk-${index}`} className={s.pointItem}>
                <span className={`${s.pointDot} ${s.pointDotRisk}`} aria-hidden="true" />
                <TypingText
                  text={item}
                  replayKey={replayKey}
                  startDelayMs={risksDelays[index]}
                  stepMs={WORD_STEP_MS}
                  className={s.pointText}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={s.adviceCard}>
        <h3 className={s.sectionTitle}>Conseils de l'assistant</h3>
        <ul className={s.adviceList}>
          {advice.map((item, index) => (
            <li key={`advice-${index}`} className={s.adviceItem}>
              <span className={s.adviceIndex}>{index + 1}</span>
              <TypingText
                text={item}
                replayKey={replayKey}
                startDelayMs={adviceDelays[index]}
                stepMs={WORD_STEP_MS}
                className={s.adviceText}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className={s.disclaimerCard}>
        <span className={s.disclaimerLabel}>Note importante</span>
        <TypingText
          text={analysis.disclaimer}
          replayKey={replayKey}
          startDelayMs={disclaimerDelay}
          stepMs={WORD_STEP_MS}
          className={s.disclaimer}
          showCaret={false}
        />
      </section>
    </div>
  )
}

function withFallback(items: string[], fallback: string) {
  return items.length > 0 ? items : [fallback]
}
