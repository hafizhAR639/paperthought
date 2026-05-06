import { useEffect, useState } from 'react';
import apiClient from '@/utils/api';
import type { Paper, Paragraph, AnalysisResult } from '@/types';

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapPaper(raw: any): Paper {
  return {
    id: raw.id,
    userId: raw.userId ?? raw.user_id ?? '',
    title: raw.title ?? '',
    originalContent: raw.originalContent ?? raw.original_content ?? '',
    currentVersionId: raw.currentVersionId ?? raw.current_version_id ?? '',
    status: raw.status ?? 'draft',
    analysisProgress: toNumber(raw.analysisProgress ?? raw.analysis_progress, 0),
    analysisMessage: raw.analysisMessage ?? raw.analysis_message ?? null,
    analysisTotalParagraphs: toNumber(raw.analysisTotalParagraphs ?? raw.analysis_total_paragraphs, 0),
    analysisProcessedParagraphs: toNumber(raw.analysisProcessedParagraphs ?? raw.analysis_processed_paragraphs, 0),
    analysisStartedAt: raw.analysisStartedAt ?? raw.analysis_started_at ?? null,
    analysisCompletedAt: raw.analysisCompletedAt ?? raw.analysis_completed_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

function mapParagraph(raw: any): Paragraph {
  return {
    id: raw.id,
    versionId: raw.versionId ?? raw.version_id ?? '',
    paragraphOrder: toNumber(raw.paragraphOrder ?? raw.paragraph_order, 0),
    originalText: raw.originalText ?? raw.original_text ?? '',
    revisedText: raw.revisedText ?? raw.revised_text ?? undefined,
    citationScore: toNumber(raw.citationScore ?? raw.citation_score, 0),
    coherenceScore: toNumber(raw.coherenceScore ?? raw.coherence_score, 0),
    alignmentScore: toNumber(raw.alignmentScore ?? raw.alignment_score, 0),
    researchGapScore: toNumber(raw.researchGapScore ?? raw.research_gap_score, 0),
    status: raw.status ?? 'pending',
    createdAt: raw.createdAt ?? raw.created_at,
  };
}

function mapAnalysisResult(raw: any): AnalysisResult {
  return {
    id: raw.id,
    paragraphId: raw.paragraphId ?? raw.paragraph_id,
    issueType: raw.issueType ?? raw.issue_type,
    severity: raw.severity,
    description: raw.description ?? '',
    suggestedAction: raw.suggestedAction ?? raw.suggested_action ?? '',
    startIndex: toNumber(raw.startIndex ?? raw.start_index, 0),
    endIndex: toNumber(raw.endIndex ?? raw.end_index, 0),
    createdAt: raw.createdAt ?? raw.created_at,
  };
}

export function usePaperData(paperId: string | null) {
  const [paper, setPaper] = useState<Paper | null>(null);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!paperId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        const [pRes, parRes, aRes] = await Promise.all([
          apiClient.get(`/papers/${paperId}`),
          apiClient.get(`/papers/${paperId}/paragraphs`),
          apiClient.get(`/papers/${paperId}/analysis`),
        ]);

        if (cancelled) return;
        const paperData = pRes.data?.data ? mapPaper(pRes.data.data) : null;
        const paragraphsData = Array.isArray(parRes.data?.data)
          ? parRes.data.data.map(mapParagraph)
          : [];
        const analysisData = Array.isArray(aRes.data?.data)
          ? aRes.data.data.map(mapAnalysisResult)
          : [];

        setPaper(paperData);
        setParagraphs(paragraphsData);
        setAnalysis(analysisData);
      } catch (err) {
        const errorMsg =
          (err as any)?.response?.data?.error ||
          (err instanceof Error ? err.message : String(err));
        console.error('[usePaperData] Error loading paper:', errorMsg, err);
        setError(errorMsg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [paperId]);

  return { paper, paragraphs, analysis, loading, error };
}
