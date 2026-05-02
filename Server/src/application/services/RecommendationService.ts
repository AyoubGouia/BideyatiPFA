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

const ANSWER_TO_TAGS: Record<string, string[]> = {
  // Q1
  "La technologie": ["tech", "informatique", "ingénierie", "logiciel", "programmation", "ia", "réseaux", "systèmes"],
  "Les sciences": ["sciences", "recherche", "santé", "biologie", "chimie", "médecine", "laboratoire"],
  "Les relations humaines": ["communication", "management", "enseignement", "éducation", "conseil", "soins", "thérapie"],
  "L'art et la créativité": ["arts", "design", "créativité", "conception", "médias"],
  // Q2
  "Mathématiques": ["statistiques", "données", "finance", "ingénierie", "économie", "analyse"],
  "Sciences (physique, SVT…)": ["sciences", "biologie", "chimie", "environnement", "santé", "médecine"],
  "Langues": ["langues", "traduction", "rédaction", "communication", "presse"],
  "Économie / gestion": ["économie", "gestion", "management", "finance", "comptabilité", "entreprise", "audit"],
  // Q3
  "Logique": ["analyse", "stratégie", "tech", "sciences", "programmation", "données"],
  "Créatif(ve)": ["créativité", "conception", "arts", "design", "médias"],
  "Sociable": ["communication", "management", "enseignement", "leadership", "soins"],
  "Organisé(e)": ["administration", "gestion", "organisation", "planification", "comptabilité", "audit"],
  // Q4
  "Suivre des règles": ["droit", "administration", "sécurité", "justice", "tribunal"],
  "Innover et tester": ["recherche", "conception", "tech", "ingénierie", "ia"],
  "Aider les autres": ["santé", "soins", "éducation", "enseignement", "thérapie", "rééducation", "médecine"],
  "Diriger une équipe": ["management", "leadership", "stratégie", "entreprise"],
  // Q5
  "Dans un bureau": ["administration", "gestion", "finance", "logiciel", "données"],
  "Sur le terrain": ["environnement", "agriculture", "rural", "architecture", "urbanisme", "industrie"],
  "À distance": ["tech", "programmation", "logiciel", "rédaction", "traduction"],
  "En déplacement": ["communication", "conseil", "audit", "presse"],
  // Q6
  "Argent": ["finance", "économie", "entreprise", "management", "industrie"],
  "Passion": ["arts", "créativité", "recherche", "sport", "design"],
  "Sécurité": ["administration", "enseignement", "santé", "justice", "concours"],
  "Reconnaissance": ["leadership", "stratégie", "médias", "plaidoirie", "médecine", "spécialisation"],
  // Q7
  "Regarder des vidéos / séries": ["médias", "arts", "communication"],
  "Lire / apprendre": ["recherche", "enseignement", "académique", "rédaction", "langues"],
  "Créer": ["créativité", "design", "conception", "arts"],
  "Jouer / expérimenter": ["tech", "logiciel", "programmation", "laboratoire", "manipulation"],
  // Q8
  "Calme et concentré": ["recherche", "analyse", "statistiques", "laboratoire", "traduction"],
  "Animé et dynamique": ["management", "communication", "médias", "clinique", "hôpital"],
  "Nature et extérieur": ["environnement", "agriculture", "agronomie", "rural", "sport"],
  "Ville et modernité": ["urbanisme", "architecture", "tech", "entreprise", "industrie"],
  // Q9
  "Le stratège": ["stratégie", "management", "conseil", "leadership"],
  "L'exécutant": ["technique", "administration", "organisation", "manipulation"],
  "Le communicant": ["communication", "relations", "langues", "pédagogie", "presse"],
  "Le créatif": ["créativité", "design", "arts", "innovation", "conception"]
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
      
      // Keep the literal answer as a tag just in case
      const currentLiteral = userTagWeights.get(rep.reponse) ?? 0;
      userTagWeights.set(rep.reponse, currentLiteral + weight);

      // Add mapped tags
      const mappedTags = ANSWER_TO_TAGS[rep.reponse] || [];
      for (const t of mappedTags) {
        const currentMapped = userTagWeights.get(t) ?? 0;
        userTagWeights.set(t, currentMapped + weight);
      }
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
