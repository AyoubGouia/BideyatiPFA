import { spawnSync } from "node:child_process";
import path from "node:path";

const run = (command: string) => {
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
};

export default async function globalSetup() {
  // Ensure tests always run against .env.test unless user overrides it.
  if (!process.env.DOTENV_CONFIG_PATH) {
    process.env.DOTENV_CONFIG_PATH = ".env.test";
  }

  // Make sure relative paths resolve from Server/ root.
  const cwd = process.cwd();
  const envPath = path.resolve(cwd, process.env.DOTENV_CONFIG_PATH);
  process.env.DOTENV_CONFIG_PATH = envPath;

  run(`node -r dotenv/config -e "process.exit(process.env.DATABASE_URL?0:1)"`);
  run(`cross-env DOTENV_CONFIG_PATH="${envPath}" npx prisma migrate deploy`);
  run(`cross-env DOTENV_CONFIG_PATH="${envPath}" ts-node prisma/seed/seedTest.ts`);
}

