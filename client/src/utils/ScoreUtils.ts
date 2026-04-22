export type Section = 'Math' | 'Science' | 'Info' | 'Technique' | 'Lettre' | 'Économie' | 'Sport'

/**
 * MG (Bac average) coefficients used for display and calculation.
 * These are the official exam coefficients per section.
 */
export const SUBJECT_COEFFICIENTS: Record<Section, Record<string, number>> = {
  Math: {
    Mathématiques: 4,
    'Sciences Physiques': 4,
    SVT: 1,
    Philosophie: 1,
    Arabe: 1,
    Français: 1,
    Anglais: 1,
    Informatique: 1,
    'Éducation Physique': 1,
    Option: 1,
  },
  Science: {
    SVT: 4,
    'Sciences Physiques': 4,
    Mathématiques: 3,
    Philosophie: 1,
    Arabe: 1,
    Français: 1,
    Anglais: 1,
    Informatique: 1,
    'Éducation Physique': 1,
    Option: 1,
  },
  Technique: {
    Technologie: 4,
    'Sciences Physiques': 4,
    Mathématiques: 3,
    Philosophie: 1,
    Arabe: 1,
    Français: 1,
    Anglais: 1,
    Informatique: 1,
    'Éducation Physique': 1,
    Option: 1,
  },
  Économie: {
    Économie: 3,
    Gestion: 3,
    Mathématiques: 2,
    'Histoire-Géo': 2,
    Philosophie: 1,
    Arabe: 1,
    Français: 1,
    Anglais: 1,
    Informatique: 1,
    'Éducation Physique': 1,
    Option: 1,
  },
  Info: {
    'Algorithmique & Programmation': 3,
    'Systèmes & T.I.': 3,
    Mathématiques: 3,
    'Sciences Physiques': 2,
    Philosophie: 1,
    Arabe: 1,
    Français: 1,
    Anglais: 1,
    'Éducation Physique': 1,
    Option: 1,
  },
  Lettre: {
    Arabe: 4,
    Philosophie: 4,
    Français: 3,
    Anglais: 3,
    'Histoire-Géo': 2,
    Informatique: 1,
    'Éducation Physique': 1,
    Option: 1,
  },
  Sport: {
    'Sciences Biologiques': 3,
    'Discipline Sportive': 3,
    'Sciences Physiques': 2,
    Mathématiques: 1,
    Philosophie: 1,
    Arabe: 1,
    Français: 1,
    Anglais: 1,
    Informatique: 1,
    Option: 1,
  },
}

/**
 * Returns the effective note for a subject in the retake (Contrôle) session.
 * Official formula: (2 × Main + Retake) / 3
 * Non-rattrapable subjects (Option, Éducation Physique) keep the main session grade.
 */
function effectiveNote(
  sub: string,
  notesP: Record<string, string>,
  notesC: Record<string, string> | undefined,
  session: 'Principale' | 'Contrôle' | undefined
): number {
  const valP = parseFloat(notesP[sub] || '0')
  if (session === 'Contrôle' && notesC && notesC[sub]) {
    // Non-rattrapable subjects
    if (sub === 'Option' || sub === 'Éducation Physique') return valP
    const valC = parseFloat(notesC[sub] || '0')
    // Official Contrôle formula: (2×P + C) / 3
    return (2 * valP + valC) / 3
  }
  return valP
}

/**
 * Calculates the overall Bac average (MG) using the section's official coefficients.
 * Option subject adds only points above 10 to the total (doesn't add to the denominator).
 */
export function calculateMG(
  section: Section,
  notesP: Record<string, string>,
  notesC?: Record<string, string>,
  session?: 'Principale' | 'Contrôle'
): number {
  const coeffs = SUBJECT_COEFFICIENTS[section]
  let totalPoints = 0
  let totalCoeffs = 0

  for (const [subject, coeff] of Object.entries(coeffs)) {
    const note = effectiveNote(subject, notesP, notesC, session)
    if (subject === 'Option') {
      // Only points above 10 count toward the total, and Option doesn't add to denominator
      if (note > 10) totalPoints += (note - 10)
    } else {
      totalPoints += note * coeff
      totalCoeffs += coeff
    }
  }

  return totalCoeffs > 0 ? totalPoints / totalCoeffs : 0
}

/**
 * Calculates the Final Score (FG / Note Globale) used for university orientation ranking.
 *
 * Formulas are from the official Tunisian orientation guide:
 *
 * Math:      FG = 4×MG + 2×M  + 1.5×SP + 0.5×SVT + 1×F + 1×Ang
 * Science:   FG = 4×MG + 1×M  + 1.5×SP + 1.5×SVT + 1×F + 1×Ang
 * Technique: FG = 4×MG + 1.5×TE + 1.5×M + 1×SP + 1×F + 1×Ang
 * Lettre:    FG = 4×MG + 1.5×A + 1.5×PH + 1×HG + 1×F + 1×Ang
 * Économie:  FG = 4×MG + 1.5×Ec + 1.5×Ge + 0.5×M + 0.5×HG + 1×F + 1×Ang
 * Sport:     FG = 4×MG + 1.5×SB + 1×Sp-sport + 0.5×EP + 0.5×SP + 0.5×PH + 1×F + 1×Ang
 * Info:      FG = 4×MG + 1.5×M + 1.5×Algo + 0.5×SP + 0.5×STI + 1×F + 1×Ang
 */
export function calculateFG(
  section: Section,
  mg: number,
  notesP: Record<string, string>,
  notesC?: Record<string, string>,
  session?: 'Principale' | 'Contrôle'
): number {
  const n = (sub: string) => effectiveNote(sub, notesP, notesC, session)

  switch (section) {
    case 'Math':
      // FG = 4×MG + 2×M + 1.5×SP + 0.5×SVT + 1×F + 1×Ang
      return (
        4 * mg +
        2   * n('Mathématiques') +
        1.5 * n('Sciences Physiques') +
        0.5 * n('SVT') +
        1   * n('Français') +
        1   * n('Anglais')
      )

    case 'Science':
      // FG = 4×MG + 1×M + 1.5×SP + 1.5×SVT + 1×F + 1×Ang
      return (
        4 * mg +
        1   * n('Mathématiques') +
        1.5 * n('Sciences Physiques') +
        1.5 * n('SVT') +
        1   * n('Français') +
        1   * n('Anglais')
      )

    case 'Technique':
      // FG = 4×MG + 1.5×TE + 1.5×M + 1×SP + 1×F + 1×Ang
      return (
        4 * mg +
        1.5 * n('Technologie') +
        1.5 * n('Mathématiques') +
        1   * n('Sciences Physiques') +
        1   * n('Français') +
        1   * n('Anglais')
      )

    case 'Info':
      // FG = 4×MG + 1.5×M + 1.5×Algo + 0.5×SP + 0.5×STI + 1×F + 1×Ang
      return (
        4 * mg +
        1.5 * n('Mathématiques') +
        1.5 * n('Algorithmique & Programmation') +
        0.5 * n('Sciences Physiques') +
        0.5 * n('Systèmes & T.I.') +
        1   * n('Français') +
        1   * n('Anglais')
      )

    case 'Lettre':
      // FG = 4×MG + 1.5×A + 1.5×PH + 1×HG + 1×F + 1×Ang
      return (
        4 * mg +
        1.5 * n('Arabe') +
        1.5 * n('Philosophie') +
        1   * n('Histoire-Géo') +
        1   * n('Français') +
        1   * n('Anglais')
      )

    case 'Économie':
      // FG = 4×MG + 1.5×Ec + 1.5×Ge + 0.5×M + 0.5×HG + 1×F + 1×Ang
      return (
        4 * mg +
        1.5 * n('Économie') +
        1.5 * n('Gestion') +
        0.5 * n('Mathématiques') +
        0.5 * n('Histoire-Géo') +
        1   * n('Français') +
        1   * n('Anglais')
      )

    case 'Sport':
      // FG = 4×MG + 1.5×SB + 1×Sp-sport + 0.5×EP + 0.5×SP + 0.5×PH + 1×F + 1×Ang
      return (
        4 * mg +
        1.5 * n('Sciences Biologiques') +
        1   * n('Discipline Sportive') +
        0.5 * n('Éducation Physique') +
        0.5 * n('Sciences Physiques') +
        0.5 * n('Philosophie') +
        1   * n('Français') +
        1   * n('Anglais')
      )

    default:
      return 0
  }
}
