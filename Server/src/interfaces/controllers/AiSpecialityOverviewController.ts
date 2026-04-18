import { Request, Response } from "express";
import { z } from "zod";
import { AiSpecialityOverviewAggregationService } from "../../application/services/AiSpecialityOverviewAggregationService";
import { GeminiAiService } from "../../application/services/GeminiAiService";
import { buildAiSpecialityOverviewPrompt } from "../../application/utils/aiSpecialityOverviewPrompt";
import { HttpError } from "../../application/utils/httpError";
import {
  specialityOverviewAnalysisSchema,
  specialityOverviewResponseSchema,
  specialityOverviewSchema,
} from "../validation/aiSchemas";
import type { SpecialityOverviewAnalysis } from "../validation/aiSchemas";

export class AiSpecialityOverviewController {
  private aggregationService = new AiSpecialityOverviewAggregationService();
  private geminiAiService?: GeminiAiService;

  getSpecialityOverview = async (req: Request, res: Response) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parsed = specialityOverviewSchema.parse(req.body);
      const aggregatedContext = await this.aggregationService.buildOverview({
        userId,
        specialiteId: parsed.specialiteId,
        year: parsed.year,
      });

      const prompt = buildAiSpecialityOverviewPrompt(aggregatedContext);
      const rawAnalysis = await this.getGeminiAiService().generateJson(prompt);
      const analysis = this.parseGeminiAnalysis(rawAnalysis);

      const responsePayload = specialityOverviewResponseSchema.safeParse({
        specialiteId: aggregatedContext.speciality.id,
        yearRequested: parsed.year ?? null,
        yearUsed: aggregatedContext.historicalData.yearUsed,
        completeness: {
          hasSection: Boolean(aggregatedContext.student.bacSection),
          hasMoyenne: aggregatedContext.student.moyenneBac !== null,
          hasNotes: aggregatedContext.student.notes.length > 0,
          hasQuestionnaire:
            aggregatedContext.student.questionnaire.answers.length > 0,
          hasHistoricalScore:
            aggregatedContext.historicalData.lastAdmittedScore !== null,
          hasCapacity: aggregatedContext.historicalData.capacities.length > 0,
        },
        analysis,
      });

      if (!responsePayload.success) {
        throw new HttpError(
          500,
          "Failed to build AI speciality overview response",
          {
            issues: responsePayload.error.issues,
          }
        );
      }

      res.status(200).json(responsePayload.data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.issues });
        return;
      }
      if (error instanceof HttpError) {
        res
          .status(error.statusCode)
          .json({ error: error.message, details: error.details });
        return;
      }
      console.error("[AiSpecialityOverviewController] Unexpected error:", error);
      res.status(500).json({ error: "Failed to build AI speciality overview" });
    }
  };

  private getGeminiAiService(): GeminiAiService {
    if (!this.geminiAiService) {
      this.geminiAiService = new GeminiAiService();
    }

    return this.geminiAiService;
  }

  private parseGeminiAnalysis(rawAnalysis: string): SpecialityOverviewAnalysis {
    const normalizedAnalysis = rawAnalysis.trim();
    const candidates = [
      normalizedAnalysis,
      this.unwrapJsonCodeFence(normalizedAnalysis),
    ];

    let invalidJsonDetected = false;
    let shapeIssues: z.ZodIssue[] | null = null;

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      try {
        const parsedJson = JSON.parse(candidate);
        const parsedAnalysis =
          specialityOverviewAnalysisSchema.safeParse(parsedJson);

        if (parsedAnalysis.success) {
          return parsedAnalysis.data;
        }

        shapeIssues = parsedAnalysis.error.issues;
      } catch {
        invalidJsonDetected = true;
      }
    }

    if (shapeIssues) {
      throw new HttpError(
        502,
        "AI output validation failed: Gemini returned an invalid response shape",
        {
          issues: shapeIssues,
        }
      );
    }

    if (invalidJsonDetected) {
      throw new HttpError(
        502,
        "AI output validation failed: Gemini returned invalid JSON"
      );
    }

    throw new HttpError(502, "AI output validation failed");
  }

  private unwrapJsonCodeFence(value: string): string {
    const fencedMatch = value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (!fencedMatch) {
      return value;
    }

    return fencedMatch[1].trim();
  }
}
