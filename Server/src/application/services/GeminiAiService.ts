import { GoogleGenAI } from "@google/genai";
import { env } from "../../infrastructure/config/env";
import { HttpError } from "../utils/httpError";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const SMOKE_TEST_PROMPT =
  "Return valid JSON only with keys label and summary.";
const RETRYABLE_PROVIDER_STATUS_CODES = new Set([429, 503]);
const RETRYABLE_PROVIDER_STATUSES = new Set([
  "RESOURCE_EXHAUSTED",
  "UNAVAILABLE",
]);
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 900;

type GeminiRequestOptions = {
  responseMimeType?: string;
};

type GeminiProviderError = {
  statusCode: number | null;
  status: string | null;
  message: string | null;
};

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

    return this.generateContentText(trimmedPrompt, {
      emptyResponseMessage: "Gemini returned an empty response",
      failureMessage: "Gemini request failed",
    });
  }

  async generateJson(prompt: string): Promise<string> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      throw new HttpError(400, "Gemini prompt must not be empty");
    }

    return this.generateContentText(trimmedPrompt, {
      responseMimeType: "application/json",
      emptyResponseMessage: "Gemini returned an empty JSON response",
      failureMessage: "Gemini JSON request failed",
    });
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

  private async generateContentText(
    prompt: string,
    {
      responseMimeType,
      emptyResponseMessage,
      failureMessage,
    }: GeminiRequestOptions & {
      emptyResponseMessage: string;
      failureMessage: string;
    }
  ): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          ...(responseMimeType
            ? {
                config: {
                  responseMimeType,
                },
              }
            : {}),
        });

        const text = response.text?.trim();
        if (!text) {
          throw new HttpError(502, emptyResponseMessage);
        }

        if (attempt > 1) {
          console.info(
            `[GeminiAiService] Request succeeded after retry ${attempt}/${MAX_RETRY_ATTEMPTS} for model ${this.model}.`
          );
        }

        return text;
      } catch (error) {
        if (error instanceof HttpError) {
          throw error;
        }

        lastError = error;
        const providerError = this.extractProviderError(error);
        const shouldRetry =
          attempt < MAX_RETRY_ATTEMPTS &&
          this.isRetryableProviderError(providerError);

        if (shouldRetry) {
          const delayMs = RETRY_DELAY_MS * attempt;
          console.warn(
            `[GeminiAiService] Transient Gemini failure on attempt ${attempt}/${MAX_RETRY_ATTEMPTS} for model ${this.model}. Retrying in ${delayMs}ms.`,
            providerError
          );
          await this.sleep(delayMs);
          continue;
        }

        console.error(
          `[GeminiAiService] Gemini request failed for model ${this.model}.`,
          providerError
        );

        throw new HttpError(502, failureMessage, {
          cause: error instanceof Error ? error.message : error,
          providerStatusCode: providerError.statusCode,
          providerStatus: providerError.status,
          providerMessage: providerError.message,
        });
      }
    }

    throw new HttpError(502, failureMessage, {
      cause: lastError instanceof Error ? lastError.message : lastError,
    });
  }

  private extractProviderError(error: unknown): GeminiProviderError {
    const fallbackMessage =
      error instanceof Error ? error.message : String(error ?? "");
    const parsed = this.tryParseProviderMessage(fallbackMessage);

    if (parsed) {
      return parsed;
    }

    return {
      statusCode: null,
      status: null,
      message: fallbackMessage || null,
    };
  }

  private tryParseProviderMessage(value: string): GeminiProviderError | null {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value) as {
        error?: {
          code?: unknown;
          status?: unknown;
          message?: unknown;
        };
      };

      const providerError = parsed.error;
      if (!providerError) {
        return null;
      }

      return {
        statusCode:
          typeof providerError.code === "number" ? providerError.code : null,
        status:
          typeof providerError.status === "string" ? providerError.status : null,
        message:
          typeof providerError.message === "string"
            ? providerError.message
            : null,
      };
    } catch {
      return null;
    }
  }

  private isRetryableProviderError(error: GeminiProviderError): boolean {
    return (
      (error.statusCode !== null &&
        RETRYABLE_PROVIDER_STATUS_CODES.has(error.statusCode)) ||
      (error.status !== null && RETRYABLE_PROVIDER_STATUSES.has(error.status))
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
