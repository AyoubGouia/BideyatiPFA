export type Section = 'Math' | 'Science' | 'Info' | 'Technique' | 'Lettre' | 'Économie' | 'Sport'

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

export function calculateMG(
  section: Section, 
  notesP: Record<string, string>, 
  notesC?: Record<string, string>, 
  session?: 'Principale' | 'Contrôle'
): number {
  const coeffs = SUBJECT_COEFFICIENTS[section]
  let totalPoints = 0
  let totalCoeffs = 0

  const getEffectiveNote = (sub: string) => {
    const valP = parseFloat(notesP[sub] || '0')
    if (session === 'Contrôle' && notesC && notesC[sub]) {
      const valC = parseFloat(notesC[sub])
      // Rules: For facultative options or non-rattrapable subjects, Principal is usually kept.
      // But the general rule for MG_c is max(P, C).
      if (sub === 'Option' || sub === 'Éducation Physique') return valP // non-rattrapable exceptions
      return Math.max(valP, valC)
    }
    return valP
  }

  for (const [subject, coeff] of Object.entries(coeffs)) {
    const note = getEffectiveNote(subject)
    if (subject === 'Option') {
      // For Option, we only take points > 10 (official Bac rule if applicable, but user's logic is just best of both)
      // Standard Bac Tunisia MG calculation: (Σ Note*Coeff) / Σ Coeff.
      // Option usually adds only points above 10.
      const valP = parseFloat(notesP[subject] || '0')
      if (valP > 10) {
        totalPoints += (valP - 10)
      }
      // Note: totalCoeffs doesn't include Option for the denominator in standard Bac.
    } else if (subject === 'Éducation Physique') {
        totalPoints += note * coeff
        totalCoeffs += coeff
    } else {
      totalPoints += note * coeff
      totalCoeffs += coeff
    }
  }

  return totalCoeffs > 0 ? totalPoints / totalCoeffs : 0
}

export function calculateFG(
  section: Section, 
  mg: number, 
  notesP: Record<string, string>,
  notesC?: Record<string, string>,
  session?: 'Principale' | 'Contrôle'
): number {
  const n = (s: string) => {
    const valP = parseFloat(notesP[s] || '0')
    if (session === 'Contrôle' && notesC && notesC[s]) {
      const valC = parseFloat(notesC[s])
      return Math.max(valP, valC)
    }
    return valP
  }

  switch (section) {
    case 'Math':
      // 4 * MG_c + 1.5 * M + 1.5 * P + 0.5 * F + 0.5 * Ang
      return 4 * mg + 1.5 * n('Mathématiques') + 1.5 * n('Sciences Physiques') + 0.5 * n('Français') + 0.5 * n('Anglais')

    case 'Science':
      // 4 * MG_c + 1.5 * Sn + 1 * M + 1 * P + 0.25 * F + 0.25 * Ang
      return 4 * mg + 1.5 * n('SVT') + n('Mathématiques') + n('Sciences Physiques') + 0.25 * n('Français') + 0.25 * n('Anglais')

    case 'Technique':
      // 4 * MG_c + 1.5 * T + 1 * M + 1 * P + 0.25 * F + 0.25 * Ang
      return 4 * mg + 1.5 * n('Technologie') + n('Mathématiques') + n('Sciences Physiques') + 0.25 * n('Français') + 0.25 * n('Anglais')

    case 'Info':
      // 4 * MG_c + 1.5 * STI + 1.5 * M + 0.5 * P + 0.25 * F + 0.25 * Ang
      return 4 * mg + 1.5 * n('Systèmes & T.I.') + 1.5 * n('Mathématiques') + 0.5 * n('Sciences Physiques') + 0.25 * n('Français') + 0.25 * n('Anglais')

    case 'Lettre':
      // 4 * MG_c + 1.5 * A + 1.5 * Ph + 1 * F + 1 * Ang
      return 4 * mg + 1.5 * n('Arabe') + 1.5 * n('Philosophie') + n('Français') + n('Anglais')

    case 'Économie':
      // 4 * MG_c + 1.5 * Eco + 1.5 * Gest + 0.5 * HG + 0.25 * F + 0.25 * Ang
      return 4 * mg + 1.5 * n('Économie') + 1.5 * n('Gestion') + 0.5 * n('Histoire-Géo') + 0.25 * n('Français') + 0.25 * n('Anglais')

    case 'Sport':
      // 4 * MG_c + 1.5 * Bio + 1.5 * SpTh + 0.5 * P + 0.25 * F + 0.25 * Ang
      return 4 * mg + 1.5 * n('Sciences Biologiques') + 1.5 * n('Discipline Sportive') + 0.5 * n('Sciences Physiques') + 0.25 * n('Français') + 0.25 * n('Anglais')

    default:
      return 0
  }
}


