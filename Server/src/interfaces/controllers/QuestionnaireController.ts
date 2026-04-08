import { Request, Response } from "express";
import { z } from "zod";
import { QuestionnaireService } from "../../application/services/QuestionnaireService";
import { HttpError } from "../../application/utils/httpError";
import { submitQuestionnaireSchema } from "../validation/questionnaireSchemas";

export class QuestionnaireController {
  private questionnaireService = new QuestionnaireService();

  submitQuestionnaire = async (req: Request, res: Response) => {
    try {
      console.log('[QuestionnaireController] Starting questionnaire submission for user:', req.auth?.userId);
      const userId = req.auth?.userId;
      if (!userId) {
        console.warn('[QuestionnaireController] Unauthorized attempt (no userId)');
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      console.log('[QuestionnaireController] Payload received:', JSON.stringify(req.body, null, 2));
      const parsed = submitQuestionnaireSchema.parse(req.body);
      console.log('[QuestionnaireController] Validation successful, calling service...');
      
      await this.questionnaireService.submit({
        userId,
        reponses: parsed.reponses,
        notes: parsed.notes,
      });

      console.log('[QuestionnaireController] Questionnaire submitted successfully');
      res.status(201).json({ message: "Questionnaire submitted" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn('[QuestionnaireController] Validation failed:', error.issues);
        res.status(400).json({ error: "Validation error", details: error.issues });
        return;
      }
      if (error instanceof HttpError) {
        console.warn('[QuestionnaireController] Application error:', error.message);
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
      }
      console.error('[QuestionnaireController] Unexpected error:', error);
      res.status(500).json({ error: "Failed to submit questionnaire" });
    }
  };
}

