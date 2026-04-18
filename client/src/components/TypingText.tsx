import { useEffect, useMemo, useState } from 'react'
import s from './TypingText.module.css'

interface Props {
  text: string
  replayKey: number
  startDelayMs?: number
  stepMs?: number
  className?: string
  showCaret?: boolean
}

export default function TypingText({
  text,
  replayKey,
  startDelayMs = 0,
  stepMs = 68,
  className,
  showCaret = true,
}: Props) {
  const words = useMemo(
    () => text.split(/\s+/).map((word) => word.trim()).filter(Boolean),
    [text]
  )
  const [visibleWordCount, setVisibleWordCount] = useState(0)

  useEffect(() => {
    setVisibleWordCount(0)

    if (words.length === 0) {
      return
    }

    let cancelled = false
    const timers: number[] = []

    const revealWord = (index: number) => {
      if (cancelled) return

      setVisibleWordCount(index)
      if (index >= words.length) {
        return
      }

      const timer = window.setTimeout(() => revealWord(index + 1), stepMs)
      timers.push(timer)
    }

    const starter = window.setTimeout(() => revealWord(1), startDelayMs)
    timers.push(starter)

    return () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [replayKey, startDelayMs, stepMs, words])

  const visibleText = words.slice(0, visibleWordCount).join(' ')
  const rootClassName = [s.root, className].filter(Boolean).join(' ')
  const shouldShowCaret = showCaret && visibleWordCount > 0 && visibleWordCount < words.length

  return (
    <span className={rootClassName}>
      <span className={s.measure} aria-hidden="true">
        {text}
      </span>
      <span className={s.visible}>
        {visibleText}
        {shouldShowCaret && <span className={s.caret} aria-hidden="true" />}
      </span>
    </span>
  )
}
