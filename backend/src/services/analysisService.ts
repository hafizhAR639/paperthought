import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database";
import {
  ANALYSIS_LIMITS,
  analyzeTextWithGeminiRetry,
  normalizeTextForAnalysis,
  analyzeMock,
} from "./aiService";

/**
 * Pause execution for the given number of milliseconds.
 * Used to pace API calls and stay within free-tier rate limits.
 */
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Delay between successive paragraph API calls (milliseconds).
 * 4 000 ms → max ~15 req/min, safely under typical free-tier limits (20 RPM).
 * Override via env: ANALYSIS_INTER_REQUEST_DELAY_MS
 */
const INTER_REQUEST_DELAY_MS = parseInt(
  process.env.ANALYSIS_INTER_REQUEST_DELAY_MS || "4000",
  10,
);

function buildAnalysisMessage(
  processedParagraphs: number,
  totalParagraphs: number,
  skippedParagraphs: number,
): string {
  const parts = [
    `Analyzing paragraph ${processedParagraphs} of ${totalParagraphs}`,
  ];

  if (skippedParagraphs > 0) {
    parts.push(
      `(${skippedParagraphs} paragraph${skippedParagraphs === 1 ? "" : "s"} skipped by limit)`,
    );
  }

  return parts.join(" ");
}

function normalizeScore(value: unknown): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(10, Math.round(numericValue * 100) / 100));
}

async function updatePaperAnalysisState(
  paperId: string,
  patch: {
    status?: string;
    progress?: number;
    message?: string | null;
    totalParagraphs?: number;
    processedParagraphs?: number;
    started?: boolean;
    completed?: boolean;
    overallScore?: number | null;
  },
): Promise<void> {
  const updates: string[] = [];
  const values: Array<string | number | null | Date> = [];

  if (patch.status !== undefined) {
    values.push(patch.status);
    updates.push(`status = $${values.length}`);
  }

  if (patch.progress !== undefined) {
    values.push(patch.progress);
    updates.push(`analysis_progress = $${values.length}`);
  }

  if (patch.message !== undefined) {
    values.push(patch.message);
    updates.push(`analysis_message = $${values.length}`);
  }

  if (patch.totalParagraphs !== undefined) {
    values.push(patch.totalParagraphs);
    updates.push(`analysis_total_paragraphs = $${values.length}`);
  }

  if (patch.processedParagraphs !== undefined) {
    values.push(patch.processedParagraphs);
    updates.push(`analysis_processed_paragraphs = $${values.length}`);
  }

  if (patch.started) {
    updates.push("analysis_started_at = NOW()");
  }

  if (patch.completed) {
    updates.push("analysis_completed_at = NOW()");
  }

  updates.push("updated_at = NOW()");

  if (updates.length === 0) {
    return;
  }

  values.push(paperId);
  await pool.query(
    `UPDATE papers SET ${updates.join(", ")} WHERE id = $${values.length}`,
    values,
  );
}

/**
 * Run background analysis for a paper.
 * Fetches paragraphs, analyzes them with Gemini, updates scores, and stores results.
 */
export async function runPaperAnalysis(
  paperId: string,
  userId: string,
): Promise<void> {
  try {
    const paperResult = await pool.query(
      `SELECT id, title, current_version_id, status FROM papers WHERE id = $1 AND user_id = $2`,
      [paperId, userId],
    );

    if (paperResult.rows.length === 0) {
      return;
    }

    const paper = paperResult.rows[0];

    const paragraphResult = await pool.query(
      `SELECT id, original_text FROM paragraphs WHERE version_id = $1 ORDER BY paragraph_order ASC`,
      [paper.current_version_id],
    );

    const paragraphs = paragraphResult.rows;
    const paragraphsToAnalyze = paragraphs.slice(
      0,
      ANALYSIS_LIMITS.maxParagraphs,
    );
    const skippedParagraphs = paragraphs.length - paragraphsToAnalyze.length;

    // Clear prior analysis results
    await pool.query(
      `DELETE FROM analysis_results ar
       USING paragraphs p
       WHERE ar.paragraph_id = p.id AND p.version_id = $1`,
      [paper.current_version_id],
    );

    // Update to "analyzing" state
    await updatePaperAnalysisState(paperId, {
      status: "analyzing",
      progress: 0,
      message: buildAnalysisMessage(
        0,
        paragraphsToAnalyze.length,
        skippedParagraphs,
      ),
      totalParagraphs: paragraphsToAnalyze.length,
      processedParagraphs: 0,
      started: true,
    });

    let totalScore = 0;
    let paragraphsProcessed = 0;
    let paragraphsNeedingRevision = 0;
    const now = new Date();

    // Analyze each paragraph
    for (const paragraph of paragraphsToAnalyze) {
      try {
        const analysis = await analyzeTextWithGeminiRetry(
          normalizeTextForAnalysis(paragraph.original_text),
          paper.title,
        );

        if (!analysis || typeof analysis !== "object") {
          console.error("Invalid analysis result format:", analysis);
          // Fallback to mock
          const mockResult = analyzeMock(
            normalizeTextForAnalysis(paragraph.original_text),
            paper.title,
          );
          const citationScore = normalizeScore(mockResult.citation_score);
          const coherenceScore = normalizeScore(mockResult.coherence_score);
          const alignmentScore = normalizeScore(mockResult.alignment_score);
          const researchGapScore = normalizeScore(
            mockResult.research_gap_score,
          );
          const avgScore =
            (citationScore +
              coherenceScore +
              alignmentScore +
              researchGapScore) /
            4;

          await pool.query(
            `UPDATE paragraphs SET citation_score = $1, coherence_score = $2, alignment_score = $3, research_gap_score = $4, status = $5
             WHERE id = $6`,
            [
              citationScore,
              coherenceScore,
              alignmentScore,
              researchGapScore,
              avgScore < 5 ? "needs_revision" : "pending",
              paragraph.id,
            ],
          );
          totalScore += avgScore;
          paragraphsProcessed += 1;
          continue;
        }

        const citationScore = normalizeScore(analysis.citation_score);
        const coherenceScore = normalizeScore(analysis.coherence_score);
        const alignmentScore = normalizeScore(analysis.alignment_score);
        const researchGapScore = normalizeScore(analysis.research_gap_score);
        const avgScore =
          (citationScore + coherenceScore + alignmentScore + researchGapScore) /
          4;

        // Update paragraph scores
        await pool.query(
          `UPDATE paragraphs SET citation_score = $1, coherence_score = $2, alignment_score = $3, research_gap_score = $4, status = $5
           WHERE id = $6`,
          [
            citationScore,
            coherenceScore,
            alignmentScore,
            researchGapScore,
            avgScore < 5 ? "needs_revision" : "pending",
            paragraph.id,
          ],
        );

        if (avgScore < 5) {
          paragraphsNeedingRevision += 1;
        }

        // Store analysis results (issues)
        for (const issue of analysis.issues || []) {
          const resultId = uuidv4();
          await pool.query(
            `INSERT INTO analysis_results (id, paragraph_id, issue_type, severity, description, suggested_action, start_index, end_index, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              resultId,
              paragraph.id,
              issue.type,
              issue.severity,
              issue.description,
              issue.suggested_action,
              0,
              0,
              now,
            ],
          );
        }

        totalScore += avgScore;
      } catch (error) {
        console.error(`Failed to analyze paragraph ${paragraph.id}:`, error);
        // Log the failure but continue to next paragraph
        await pool.query(
          `INSERT INTO analysis_results (id, paragraph_id, issue_type, severity, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            uuidv4(),
            paragraph.id,
            "analysis_error",
            "major",
            `Analysis failed. Reason: ${error instanceof Error ? error.message : String(error)}`,
            now,
          ],
        );
      } finally {
        paragraphsProcessed += 1;
        const progress =
          paragraphsToAnalyze.length > 0
            ? Math.round(
                (paragraphsProcessed / paragraphsToAnalyze.length) * 100,
              )
            : 100;

        // Update progress in DB
        await updatePaperAnalysisState(paperId, {
          progress,
          message: buildAnalysisMessage(
            paragraphsProcessed,
            paragraphsToAnalyze.length,
            skippedParagraphs,
          ),
          processedParagraphs: paragraphsProcessed,
        });

        // Rate-limit guard: pause between API calls so we don't exhaust
        // the free-tier quota (default 4 s → ~15 req/min max).
        // Skip the delay after the very last paragraph.
        if (paragraphsProcessed < paragraphsToAnalyze.length) {
          await sleep(INTER_REQUEST_DELAY_MS);
        }
      }
    }

    const overallScore =
      paragraphsToAnalyze.length > 0
        ? normalizeScore(totalScore / paragraphsToAnalyze.length)
        : 0;
    const finalStatus =
      paragraphsNeedingRevision > 0 ? "revision" : "completed";

    // Update version with overall score
    await pool.query(
      `UPDATE paper_versions SET overall_score = $1 WHERE id = $2`,
      [overallScore, paper.current_version_id],
    );

    // Final update to completed
    await updatePaperAnalysisState(paperId, {
      status: finalStatus,
      progress: 100,
      message:
        skippedParagraphs > 0
          ? `Analysis finished. ${skippedParagraphs} paragraph(s) were skipped by limit.`
          : "Analysis finished.",
      completed: true,
      processedParagraphs: paragraphsToAnalyze.length,
      overallScore,
    });
  } catch (error) {
    console.error("Background analysis error:", error);

    // Mark as failed
    await updatePaperAnalysisState(paperId, {
      status: "draft",
      progress: 0,
      message: "Analysis failed. Please try again.",
    });
  }
}
