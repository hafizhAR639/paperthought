import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

function resolveEnvPath(): string | undefined {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "backend", ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

const envPath = resolveEnvPath();

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl:
    process.env.DATABASE_URL || "postgresql://localhost/paperthought",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-key",

  // OpenRouter API — provides NVIDIA Nemotron (free tier)
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel:
    process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",

  fileStoragePath: process.env.FILE_STORAGE_PATH || "./uploads",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
};

export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";
