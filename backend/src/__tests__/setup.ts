// Mock uuid to avoid ESM parsing issues in Jest
jest.mock('uuid', () => ({ v4: () => '00000000-0000-4000-8000-000000000000' }));

import { pool } from '../config/database';

export async function setupTestDatabase(): Promise<void> {
  // Create fresh test database tables
  const migrations = [
    `DROP TABLE IF EXISTS analysis_results CASCADE;`,
    `DROP TABLE IF EXISTS suggestions CASCADE;`,
    `DROP TABLE IF EXISTS paragraphs CASCADE;`,
    `DROP TABLE IF EXISTS paper_versions CASCADE;`,
    `DROP TABLE IF EXISTS reference_findings CASCADE;`,
    `DROP TABLE IF EXISTS reference_papers CASCADE;`,
    `DROP TABLE IF EXISTS papers CASCADE;`,
    `DROP TABLE IF EXISTS users CASCADE;`,

    // Recreate tables
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      institution VARCHAR(255),
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS papers (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      original_content TEXT,
      current_version_id VARCHAR(36),
      status VARCHAR(50) DEFAULT 'draft',
      analysis_progress INTEGER DEFAULT 0,
      analysis_message TEXT,
      analysis_total_paragraphs INTEGER DEFAULT 0,
      analysis_processed_paragraphs INTEGER DEFAULT 0,
      analysis_started_at TIMESTAMP,
      analysis_completed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS paper_versions (
      id VARCHAR(36) PRIMARY KEY,
      paper_id VARCHAR(36) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      overall_score DECIMAL(4,2) DEFAULT 0,
      created_at TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS paragraphs (
      id VARCHAR(36) PRIMARY KEY,
      version_id VARCHAR(36) NOT NULL REFERENCES paper_versions(id) ON DELETE CASCADE,
      paragraph_order INTEGER NOT NULL,
      original_text TEXT NOT NULL,
      revised_text TEXT,
      citation_score DECIMAL(4,2) DEFAULT 0,
      coherence_score DECIMAL(4,2) DEFAULT 0,
      alignment_score DECIMAL(4,2) DEFAULT 0,
      research_gap_score DECIMAL(4,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS analysis_results (
      id VARCHAR(36) PRIMARY KEY,
      paragraph_id VARCHAR(36) NOT NULL REFERENCES paragraphs(id) ON DELETE CASCADE,
      issue_type VARCHAR(100) NOT NULL,
      severity VARCHAR(20),
      description TEXT,
      suggested_action TEXT,
      start_index INTEGER DEFAULT 0,
      end_index INTEGER DEFAULT 0,
      created_at TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS reference_papers (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      authors TEXT[],
      year INTEGER,
      file_path TEXT,
      extracted_content TEXT,
      created_at TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS reference_findings (
      id VARCHAR(36) PRIMARY KEY,
      reference_id VARCHAR(36) NOT NULL REFERENCES reference_papers(id) ON DELETE CASCADE,
      finding_type VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      page_number INTEGER,
      embedding DOUBLE PRECISION[],
      created_at TIMESTAMP NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS suggestions (
      id VARCHAR(36) PRIMARY KEY,
      paragraph_id VARCHAR(36) NOT NULL REFERENCES paragraphs(id) ON DELETE CASCADE,
      finding_id VARCHAR(36) NOT NULL REFERENCES reference_findings(id) ON DELETE CASCADE,
      relevance_score DECIMAL(4,2),
      explanation TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL
    );`,
  ];

  for (const migration of migrations) {
    try {
      await pool.query(migration);
    } catch (error: any) {
      if (error.code !== '42P01' && error.code !== '42P07') {
        throw error;
      }
    }
  }
}

export async function teardownTestDatabase(): Promise<void> {
  // Just close connection, don't drop tables yet
  // We'll rely on the setupTestDatabase to clean up next run
}

export async function clearTestDatabase(): Promise<void> {
  const tables = [
    'analysis_results',
    'suggestions',
    'paragraphs',
    'paper_versions',
    'papers',
    'reference_findings',
    'reference_papers',
    'users',
  ];

  for (const table of tables) {
    try {
      await pool.query(`DELETE FROM ${table};`);
    } catch (error: any) {
      // Ignore if table doesn't exist
    }
  }
}
