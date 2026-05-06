import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database";

// ─── Test account ────────────────────────────────────────────────────────────
const TEST_EMAIL = "test@paperthought.dev";
const TEST_PASSWORD = "Test1234!";
const TEST_NAME = "Test User";
// ─────────────────────────────────────────────────────────────────────────────

export async function runSeed(): Promise<void> {
  console.log("🌱 Running seed...");

  // Skip if test user already exists
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    TEST_EMAIL,
  ]);
  if (existing.rows.length > 0) {
    console.log(`✓ Test user already exists: ${TEST_EMAIL}`);
    return;
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const now = new Date();

  await pool.query(
    `INSERT INTO users (id, email, password_hash, full_name, institution, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, TEST_EMAIL, passwordHash, TEST_NAME, "PaperThought Dev", now, now],
  );

  console.log("");
  console.log("✅ Test account created:");
  console.log("   Email   :", TEST_EMAIL);
  console.log("   Password:", TEST_PASSWORD);
  console.log("");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
