import dotenv from "dotenv";
dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || ".env",
});

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
};
