import dotenv from "dotenv";
dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || ".env",
});

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};
