import { Request, Response } from "express";
import { z } from "zod";
import { QuestionnaireService } from "../../application/services/QuestionnaireService";
import { HttpError } from "../../application/utils/httpError";
import { submitQuestionnaireSchema } from "../validation/questionnaireSchemas";

export class QuestionnaireController {
  private questionnaireService = new QuestionnaireService();

  submitQuestionnaire = async (req: Request, res: Response) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parsed = submitQuestionnaireSchema.parse(req.body);
      await this.questionnaireService.submit({
        userId,
        reponses: parsed.reponses,
        notes: parsed.notes,
      });

      res.status(201).json({ message: "Questionnaire submitted" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.issues });
        return;
      }
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
      }
      res.status(500).json({ error: "Failed to submit questionnaire" });
    }
  };
}

