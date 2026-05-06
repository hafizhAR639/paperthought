import crypto from "node:crypto";
import { config } from "../config/index";

export const ANALYSIS_LIMITS = {
  maxParagraphs: 10,
  maxParagraphCharacters: 3000,
};

export const PAPER_LIMITS = {
  maxWords: 8000,
  maxCharacters: 50000,
};

export function normalizeTextForAnalysis(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ANALYSIS_LIMITS.maxParagraphCharacters);
}

export function countWords(text: string): number {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) {
    return 0;
  }
  return normalizedText.split(" ").length;
}

// ---------------------------------------------------------------------------
// Simple in-memory cache — prevents re-analysing identical paragraphs
// ---------------------------------------------------------------------------

interface CacheEntry {
  result: any;
  expiresAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const analysisCache = new Map<string, CacheEntry>();

function cacheGet(key: string): any | null {
  const entry = analysisCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    analysisCache.delete(key);
    return null;
  }
  return entry.result;
}

function cacheSet(key: string, result: any): void {
  analysisCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  // Evict oldest entries if cache grows large
  if (analysisCache.size > 200) {
    const firstKey = analysisCache.keys().next().value;
    if (firstKey) analysisCache.delete(firstKey);
  }
}

function makeCacheKey(text: string, context: string): string {
  const raw = `${context.slice(0, 80)}::${normalizeTextForAnalysis(text)}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

/**
 * Try to extract valid JSON from a string that may contain markdown fences or extra text.
 */
function extractJSON(inputText: string): any {
  // Remove markdown code fences
  const cleaned = inputText.replace(/```json\n?|\n?```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to grab the first JSON object found
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        console.warn(
          "Could not extract valid JSON from AI response:",
          inputText.slice(0, 200),
        );
      }
    }
    return null;
  }
}

const ANALYSIS_PROMPT = (text: string, context: string): string =>
  `Kamu adalah pakar penulisan akademik yang bertugas menganalisis paragraf dari sebuah makalah penelitian.

${context ? `Judul Makalah: ${context}` : ""}

Paragraf yang Dianalisis:
${normalizeTextForAnalysis(text)}

Evaluasi berdasarkan 4 kriteria (skor 1-10, di mana 10 adalah terbaik):
1. Kualitas Sitasi: Apakah klaim faktual didukung oleh referensi yang memadai?
2. Koherensi: Apakah kalimat-kalimat mengalir secara logis dan terhubung dengan baik?
3. Keselarasan: Apakah paragraf ini selaras dengan pertanyaan penelitian makalah?
4. Kesenjangan Penelitian: Apakah konsep dikembangkan secara mendalam atau masih dangkal?

Kembalikan HANYA JSON valid tanpa markdown fences:
{
  "citation_score": <angka 1-10>,
  "coherence_score": <angka 1-10>,
  "alignment_score": <angka 1-10>,
  "research_gap_score": <angka 1-10>,
  "issues": [
    {
      "type": "missing_citation|weak_coherence|misalignment|underdeveloped",
      "severity": "critical|major|minor",
      "description": "Penjelasan singkat dalam bahasa Indonesia",
      "text_snippet": "Kutipan teks persis dari paragraf",
      "suggested_action": "Saran perbaikan dalam bahasa Indonesia"
    }
  ],
  "overall_feedback": "Komentar konstruktif singkat dalam bahasa Indonesia"
}`;

/**
 * Analyze text using OpenRouter with NVIDIA Nemotron free model.
 *
 * Uses @openrouter/sdk with streaming — dynamically imported at runtime
 * to avoid ESM conflicts in Jest (which compiles to CommonJS via ts-jest).
 * The dynamic import is only triggered when an API key is actually present,
 * so unit tests that use analyzeMock() are completely unaffected.
 */
export async function analyzeTextWithOpenRouter(
  text: string,
  context: string = "",
): Promise<any> {
  if (!config.openrouterApiKey) {
    throw new Error("OpenRouter API key not configured (OPENROUTER_API_KEY)");
  }

  // Dynamic import prevents ESM loading at module-parse time in Jest.
  // @openrouter/sdk is ESM-only; Jest compiles to CJS via ts-jest.
  // Since analyzeTextWithOpenRouter is only called when an API key exists
  // (never during unit tests), the dynamic import is safe here.
  const { OpenRouter } = await import("@openrouter/sdk");
  const openrouter = new OpenRouter({ apiKey: config.openrouterApiKey });

  // @openrouter/sdk v0.12 wraps the request body inside `chatRequest`
  const stream = await openrouter.chat.send({
    chatRequest: {
      model: config.openrouterModel || "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        {
          role: "user" as const,
          content: ANALYSIS_PROMPT(text, context),
        },
      ],
      stream: true as const,
    },
  });

  // Collect all streaming SSE chunks into one full response string
  let fullResponse = "";
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      fullResponse += content;
    }
  }

  const analysis = extractJSON(fullResponse);
  if (!analysis) {
    throw new Error(
      `Failed to parse JSON from OpenRouter response. Raw: ${fullResponse.slice(0, 300)}`,
    );
  }
  return analysis;
}

/**
 * Mock analyzer — used as fallback when no API key is set or API is unavailable.
 */
export function analyzeMock(text: string, _context: string = ""): any {
  const wordCount = countWords(text);
  const score = Math.min(10, 5 + Math.floor(wordCount / 20));
  const issues =
    score < 7
      ? [
          {
            type: "weak_coherence",
            severity: "minor",
            description:
              "Beberapa kalimat perlu dihubungkan dengan lebih baik.",
            text_snippet: text.substring(0, 50),
            suggested_action: "Tinjau kembali transisi antar kalimat.",
          },
        ]
      : [];

  return {
    citation_score: Math.max(3, score - 1),
    coherence_score: score,
    alignment_score: Math.max(2, score - 2),
    research_gap_score: Math.min(10, score + 1),
    issues,
    overall_feedback: `Analisis lokal: ${wordCount} kata, estimasi kualitas ~${score}/10. (API tidak tersedia)`,
  };
}

const MAX_RETRIES = 3;
/** Base delay for non-429 retries (doubles each attempt) */
const BASE_RETRY_DELAY_MS = 2000;
/** How long to wait when we get a 429 Too Many Requests (free tier cool-down) */
const RATE_LIMIT_COOLDOWN_MS = 60_000; // 1 minute

/**
 * Main analysis entry point.
 *
 * Flow:
 *   1. No API key       → return mock result immediately (useful for dev)
 *   2. Cache hit        → return cached result (no API call)
 *   3. API call success → cache result and return
 *   4. 429 rate limit   → wait 60 s then retry (up to MAX_RETRIES)
 *   5. Other error      → exponential back-off then retry
 *   6. All retries fail → fall back to mock analyzer
 */
export async function analyzeTextWithGeminiRetry(
  text: string,
  context: string = "",
): Promise<any> {
  if (!config.openrouterApiKey) {
    console.warn("OPENROUTER_API_KEY not set — using mock analyzer");
    return analyzeMock(text, context);
  }

  // Check cache first — avoids redundant API calls for the same paragraph
  const cacheKey = makeCacheKey(text, context);
  const cached = cacheGet(cacheKey);
  if (cached) {
    console.log("Cache hit — skipping API call");
    return cached;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await analyzeTextWithOpenRouter(text, context);
      if (attempt > 0) {
        console.log(`OpenRouter succeeded on attempt ${attempt + 1}`);
      }
      // Store in cache so repeat analyses are free
      cacheSet(cacheKey, result);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const msg = lastError.message.toLowerCase();

      const is429 =
        msg.includes("429") ||
        msg.includes("too many requests") ||
        msg.includes("rate limit");
      const isRetryable =
        is429 ||
        msg.includes("503") ||
        msg.includes("network") ||
        msg.includes("timeout");

      if (isRetryable && attempt < MAX_RETRIES) {
        // 429 needs a much longer cool-down than other errors
        const delay = is429
          ? RATE_LIMIT_COOLDOWN_MS
          : BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        const delayLabel = is429 ? "60 s (rate limit)" : `${delay / 1000} s`;
        console.warn(
          `OpenRouter attempt ${attempt + 1}/${MAX_RETRIES + 1} failed — waiting ${delayLabel}:`,
          lastError.message,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  console.error(
    "OpenRouter unavailable after retries — falling back to mock analyzer:",
    lastError?.message,
  );
  return analyzeMock(text, context);
}

// --------------------------------------------------------------------------
// Legacy stubs — kept for backwards compatibility with other modules
// --------------------------------------------------------------------------

export async function validateRevisionWithGroq(
  _originalText: string,
  issues: any[],
  _revisedText: string,
): Promise<any> {
  return {
    improved: true,
    addressed_issues: issues.map((i) => i.type),
    remaining_issues: [],
    new_score_estimate: 8,
    feedback: "Good improvements made to address the issues.",
  };
}

export async function generateEmbeddingWithHF(
  _text: string,
): Promise<number[]> {
  return new Array(384).fill(0).map(() => Math.random());
}
