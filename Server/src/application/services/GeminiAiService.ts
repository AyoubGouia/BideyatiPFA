import { GoogleGenAI } from "@google/genai";
import { env } from "../../infrastructure/config/env";
import { HttpError } from "../utils/httpError";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const SMOKE_TEST_PROMPT =
  "Return valid JSON only with keys label and summary.";

export class GeminiAiService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly client: GoogleGenAI;

  constructor() {
    this.apiKey = this.resolveApiKey();
    this.model = this.resolveModel();
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generateText(prompt: string): Promise<string> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      throw new HttpError(400, "Gemini prompt must not be empty");
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: trimmedPrompt,
      });

      const text = response.text?.trim();
      if (!text) {
        throw new HttpError(502, "Gemini returned an empty response");
      }

      return text;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(502, "Gemini request failed", {
        cause: error instanceof Error ? error.message : error,
      });
    }
  }

  async generateJson(prompt: string): Promise<string> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      throw new HttpError(400, "Gemini prompt must not be empty");
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: trimmedPrompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new HttpError(502, "Gemini returned an empty JSON response");
      }

      return text;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(502, "Gemini JSON request failed", {
        cause: error instanceof Error ? error.message : error,
      });
    }
  }

  async runSmokeTest(): Promise<string> {
    return this.generateJson(SMOKE_TEST_PROMPT);
  }

  private resolveApiKey(): string {
    const apiKey = env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new HttpError(
        500,
        "Missing required environment variable: GEMINI_API_KEY"
      );
    }

    return apiKey;
  }

  private resolveModel(): string {
    const model = env.GEMINI_MODEL?.trim();
    if (!model) {
      return DEFAULT_GEMINI_MODEL;
    }

    return model;
  }
}
