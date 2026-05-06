import { pool } from '../config/database';

export async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');

  const migrations = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      institution VARCHAR(255),
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );`,

    // Papers table
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

    `ALTER TABLE papers ADD COLUMN IF NOT EXISTS analysis_progress INTEGER DEFAULT 0;`,
    `ALTER TABLE papers ADD COLUMN IF NOT EXISTS analysis_message TEXT;`,
    `ALTER TABLE papers ADD COLUMN IF NOT EXISTS analysis_total_paragraphs INTEGER DEFAULT 0;`,
    `ALTER TABLE papers ADD COLUMN IF NOT EXISTS analysis_processed_paragraphs INTEGER DEFAULT 0;`,
    `ALTER TABLE papers ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMP;`,
    `ALTER TABLE papers ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMP;`,

    // Paper versions table
    `CREATE TABLE IF NOT EXISTS paper_versions (
      id VARCHAR(36) PRIMARY KEY,
      paper_id VARCHAR(36) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      overall_score DECIMAL(4,2) DEFAULT 0,
      created_at TIMESTAMP NOT NULL
    );`,
    `ALTER TABLE paper_versions ALTER COLUMN overall_score TYPE DECIMAL(4,2) USING overall_score::DECIMAL(4,2);`,

    // Paragraphs table
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
    `ALTER TABLE paragraphs ALTER COLUMN citation_score TYPE DECIMAL(4,2) USING citation_score::DECIMAL(4,2);`,
    `ALTER TABLE paragraphs ALTER COLUMN coherence_score TYPE DECIMAL(4,2) USING coherence_score::DECIMAL(4,2);`,
    `ALTER TABLE paragraphs ALTER COLUMN alignment_score TYPE DECIMAL(4,2) USING alignment_score::DECIMAL(4,2);`,
    `ALTER TABLE paragraphs ALTER COLUMN research_gap_score TYPE DECIMAL(4,2) USING research_gap_score::DECIMAL(4,2);`,

    // Analysis results table
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

    // Reference papers table
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

    // Reference findings table
    `CREATE TABLE IF NOT EXISTS reference_findings (
      id VARCHAR(36) PRIMARY KEY,
      reference_id VARCHAR(36) NOT NULL REFERENCES reference_papers(id) ON DELETE CASCADE,
      finding_type VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      page_number INTEGER,
      embedding DOUBLE PRECISION[],
      created_at TIMESTAMP NOT NULL
    );`,

    // Suggestions table
    `CREATE TABLE IF NOT EXISTS suggestions (
      id VARCHAR(36) PRIMARY KEY,
      paragraph_id VARCHAR(36) NOT NULL REFERENCES paragraphs(id) ON DELETE CASCADE,
      finding_id VARCHAR(36) NOT NULL REFERENCES reference_findings(id) ON DELETE CASCADE,
      relevance_score DECIMAL(4,2),
      explanation TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL
    );`,

    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_papers_user_id ON papers(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_paper_versions_paper_id ON paper_versions(paper_id);`,
    `CREATE INDEX IF NOT EXISTS idx_paragraphs_version_id ON paragraphs(version_id);`,
    `CREATE INDEX IF NOT EXISTS idx_analysis_results_paragraph_id ON analysis_results(paragraph_id);`,
    `CREATE INDEX IF NOT EXISTS idx_reference_papers_user_id ON reference_papers(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_reference_findings_reference_id ON reference_findings(reference_id);`,
    `CREATE INDEX IF NOT EXISTS idx_suggestions_paragraph_id ON suggestions(paragraph_id);`,
  ];

  for (const migration of migrations) {
    try {
      await pool.query(migration);
      console.log('✓ Migration executed');
    } catch (error: any) {
      if (error.code === '42P07' || error.code === '42701' || error.code === '42P09') {
        // Table/Index already exists - ignore
        continue;
      }
      console.error('Migration error:', error);
      throw error;
    }
  }

  console.log('✓ All migrations completed');
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migrations failed:', error);
      process.exit(1);
    });
}
