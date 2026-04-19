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
  safe: 'Accessible',
  balanced: 'Equilibree',
  ambitious: 'Ambitieuse',
  risky: 'Selective',
}

const labelToneMap: Record<AiSpecialityOverviewResponse['analysis']['label'], string> = {
  safe: s.labelSafe,
  balanced: s.labelBalanced,
  ambitious: s.labelAmbitious,
  risky: s.labelRisky,
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
  const { analysis, yearRequested, yearUsed } = overview
  const yearLabel = yearUsed ?? yearRequested
  const keyPoints = withFallback(analysis.keyPoints, ["Conseil synthetique indisponible."])
  const advice = withFallback(analysis.advice, ["Conseil complementaire indisponible."])
  let currentDelay = 220

  const headlineDelay = currentDelay
  currentDelay += estimateDuration(analysis.headline)

  const summaryDelay = currentDelay
  currentDelay += estimateDuration(analysis.summary)

  const keyPointDelays = keyPoints.map((item) => {
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
      <section className={s.hero}>
        <div className={s.heroTop}>
          <div className={s.aiBadge}>Analyse IA</div>
          <div className={`${s.labelBadge} ${labelToneMap[analysis.label]}`}>
            {labelMap[analysis.label]}
          </div>
        </div>
        <div className={s.heroMeta}>
          <div className={s.metaPill}>
            <span className={s.metaLabel}>Niveau de confiance</span>
            <strong>{confidenceMap[analysis.confidence]}</strong>
          </div>
          {yearLabel !== null && (
            <div className={s.metaPill}>
              <span className={s.metaLabel}>Annee analysee</span>
              <strong>{yearLabel}</strong>
            </div>
          )}
        </div>
        <div className={s.heroCopy}>
          <span className={s.heroKicker}>Lecture orientative</span>
          <TypingText
            text={analysis.headline}
            replayKey={replayKey}
            startDelayMs={headlineDelay}
            stepMs={WORD_STEP_MS}
            className={s.headline}
          />
        </div>
        <TypingText
          text={analysis.summary}
          replayKey={replayKey}
          startDelayMs={summaryDelay}
          stepMs={WORD_STEP_MS}
          className={s.summary}
        />
      </section>

      <div className={s.sectionGrid}>
        <section className={s.sectionCard}>
          <div className={s.sectionHeader}>
            <span className={s.sectionEyebrow}>Points cles</span>
            <h3 className={s.sectionTitle}>Ce qu'il faut retenir</h3>
          </div>
          <ul className={s.pointList}>
            {keyPoints.map((item, index) => (
              <li key={`point-${index}`} className={s.pointItem}>
                <span className={s.pointDot} aria-hidden="true" />
                <TypingText
                  text={item}
                  replayKey={replayKey}
                  startDelayMs={keyPointDelays[index]}
                  stepMs={WORD_STEP_MS}
                  className={s.pointText}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className={`${s.sectionCard} ${s.adviceCard}`}>
          <div className={s.sectionHeader}>
            <span className={s.sectionEyebrow}>Conseils</span>
            <h3 className={s.sectionTitle}>Pistes utiles pour avancer</h3>
          </div>
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
      </div>

      <section className={s.disclaimerCard}>
        <span className={s.disclaimerLabel}>Repere</span>
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

function withFallback(items: string[], fallback: string[]) {
  return items.length > 0 ? items : fallback
}
