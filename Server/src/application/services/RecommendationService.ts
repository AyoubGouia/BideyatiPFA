import { prisma } from "../../infrastructure/config/prisma";
import { HttpError } from "../utils/httpError";

// Question weights: higher = more important for matching
const QUESTION_WEIGHTS: Record<string, number> = {
  "Tu es plus attiré(e) par :":            3, // q1 - core interest
  "Tes matières préférées sont :":          3, // q2 - academic direction
  "Tu te considères plutôt :":             2, // q3 - skills
  "Tu préfères plutôt :":                  2, // q4 - personality
  "Tu te vois travailler :":               1, // q5 - work environment
  "Ce qui te motive le plus :":            1, // q6 - motivations
  "Ton activité préférée le week-end :":   1, // q7 - lifestyle
  "Ton environnement idéal :":             1, // q8 - environment
  "Ton rôle idéal dans un groupe :":       1, // q9 - group role
};

export interface MetierRecommandation {
  id: string;
  titre: string;
  secteur: string;
  matchScore: number;       // 0-100
  matchedTags: string[];    // which of the user's answers matched
  linkedSpecialites: { id: string; nom: string; codeOrientation: string }[];
}

export class RecommendationService {
  async getMetierRecommandations(userId: string): Promise<MetierRecommandation[]> {
    // 1. Fetch the user's questionnaire answers
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { userId },
      include: { reponses: true },
    });

    if (!questionnaire) {
      throw new HttpError(409, "Questionnaire not submitted yet");
    }

    // 2. Build a weighted user tag set: tag → accumulated weight
    const userTagWeights = new Map<string, number>();
    for (const rep of questionnaire.reponses) {
      const weight = QUESTION_WEIGHTS[rep.question] ?? 1;
      const current = userTagWeights.get(rep.reponse) ?? 0;
      userTagWeights.set(rep.reponse, current + weight);
    }

    // 3. Fetch all métiers with their linked specialites
    const metiers = await prisma.metier.findMany({
      include: {
        specialites: {
          include: {
            specialite: {
              select: { id: true, nom: true, codeOrientation: true },
            },
          },
        },
      },
    });

    // 4. Score each métier
    const results: MetierRecommandation[] = [];

    for (const metier of metiers) {
      if (!metier.tags || metier.tags.length === 0) continue;

      let matchedWeight = 0;
      let totalWeight = 0;
      const matchedTags: string[] = [];

      for (const tag of metier.tags) {
        // Determine the weight of this tag based on which question it comes from
        // We use the maximum weight this tag appears at in any question
        let tagWeight = 1;
        for (const [question, weight] of Object.entries(QUESTION_WEIGHTS)) {
          // If the user gave this answer for this question, use that question's weight
          const repMatch = questionnaire.reponses.find(
            (r) => r.reponse === tag && r.question === question
          );
          if (repMatch) {
            tagWeight = Math.max(tagWeight, weight);
          }
        }
        totalWeight += tagWeight;

        if (userTagWeights.has(tag)) {
          matchedWeight += tagWeight;
          matchedTags.push(tag);
        }
      }

      const matchScore = totalWeight > 0
        ? Math.round((matchedWeight / totalWeight) * 100)
        : 0;

      // Only include métiers with at least some match
      if (matchScore > 0) {
        results.push({
          id: metier.id,
          titre: metier.titre,
          secteur: metier.secteur,
          matchScore,
          matchedTags,
          linkedSpecialites: metier.specialites.map((ms) => ms.specialite),
        });
      }
    }

    // 5. Sort by score descending, return top 15
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results.slice(0, 15);
  }
}
