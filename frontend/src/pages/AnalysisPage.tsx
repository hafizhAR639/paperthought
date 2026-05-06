import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Loader,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  Zap,
  PlayCircle,
} from "lucide-react";
import apiClient from "../utils/api";
import { usePaperData } from "../hooks/usePaperData";
import { usePaperProgress } from "../hooks/usePaperProgress";
import type { AnalysisResult } from "../types";

// ─── Label helpers ────────────────────────────────────────────────────────────

function severityLabel(s: string) {
  return s === "critical" ? "Kritis" : s === "major" ? "Mayor" : "Minor";
}

function issueTypeLabel(t: string) {
  switch (t) {
    case "missing_citation":
      return "Sitasi Kurang";
    case "weak_coherence":
      return "Koherensi Lemah";
    case "misalignment":
      return "Tidak Selaras";
    case "underdeveloped":
      return "Kurang Dikembangkan";
    default:
      return t.replace(/_/g, " ");
  }
}

function statusLabel(s: string) {
  switch (s) {
    case "draft":
      return "Draf";
    case "analyzing":
      return "Menganalisis…";
    case "completed":
      return "Selesai";
    case "revision":
      return "Perlu Revisi";
    default:
      return s;
  }
}

function getSeverityIcon(severity: string) {
  if (severity === "critical")
    return <AlertCircle className="text-red-600" size={16} />;
  if (severity === "major")
    return <AlertTriangle className="text-orange-600" size={16} />;
  return <TrendingDown className="text-yellow-600" size={16} />;
}

function getSeverityBg(severity: string) {
  if (severity === "critical") return "bg-red-50 border border-red-200";
  if (severity === "major") return "bg-orange-50 border border-orange-200";
  return "bg-yellow-50 border border-yellow-200";
}

function getSeverityBadge(severity: string) {
  if (severity === "critical") return "bg-red-200 text-red-800";
  if (severity === "major") return "bg-orange-200 text-orange-800";
  return "bg-yellow-200 text-yellow-800";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();

  const {
    paper,
    paragraphs,
    analysis: analysisResults,
    loading,
    error,
  } = usePaperData(paperId || null);
  const {
    progress: analysisProgress,
    message: analysisMessage,
    isAnalyzing,
  } = usePaperProgress(paperId || null, !!paperId);

  const handleAnalyze = async () => {
    if (!paperId) return;
    try {
      await apiClient.post(`/papers/${paperId}/analyze`);
    } catch (err) {
      console.error("Gagal memulai analisis:", err);
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <Loader className="animate-spin mx-auto mb-4" size={32} />
        <p className="text-neutral-600">Memuat data makalah…</p>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
        <p className="text-red-600 mb-2 font-medium">
          {error ?? "Makalah tidak ditemukan"}
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-primary mt-4"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const isDraft = paper.status === "draft";
  const isRunning = paper.status === "analyzing" || isAnalyzing;
  const hasResult = paper.status === "completed" || paper.status === "revision";

  // Only display paragraphs that were actually scored (score > 0)
  const scoredParagraphs = paragraphs.filter(
    (p) =>
      p.citationScore > 0 ||
      p.coherenceScore > 0 ||
      p.alignmentScore > 0 ||
      p.researchGapScore > 0,
  );

  const overallScore =
    scoredParagraphs.length > 0
      ? (
          scoredParagraphs.reduce(
            (sum, p) =>
              sum +
              (p.citationScore +
                p.coherenceScore +
                p.alignmentScore +
                p.researchGapScore) /
                4,
            0,
          ) / scoredParagraphs.length
        ).toFixed(1)
      : null;

  const criticalCount = analysisResults.filter(
    (a) => a.severity === "critical",
  ).length;
  const majorCount = analysisResults.filter(
    (a) => a.severity === "major",
  ).length;

  const issuesByParagraph: Record<string, AnalysisResult[]> = {};
  analysisResults.forEach((issue) => {
    if (!issuesByParagraph[issue.paragraphId])
      issuesByParagraph[issue.paragraphId] = [];
    issuesByParagraph[issue.paragraphId].push(issue);
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">{paper.title}</h1>
        <p className="text-neutral-600 mt-2">
          Laporan Analisis Makalah Akademik
        </p>
      </div>

      {/* ── Summary cards (only after analysis) ── */}
      {hasResult && overallScore !== null && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="text-sm text-neutral-600">Skor Keseluruhan</div>
            <div className="text-4xl font-bold text-primary-600 mt-2">
              {overallScore}/10
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Rata-rata seluruh paragraf
            </p>
          </div>
          <div className="card">
            <div className="text-sm text-neutral-600">Paragraf Dianalisis</div>
            <div className="text-4xl font-bold text-neutral-900 mt-2">
              {scoredParagraphs.length}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              dari {paragraphs.length} total
            </p>
          </div>
          <div className="card">
            <div className="text-sm text-neutral-600">Masalah Ditemukan</div>
            <div className="text-4xl font-bold text-warning mt-2">
              {analysisResults.length}
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                  Kritis: {criticalCount}
                </span>
              )}
              {majorCount > 0 && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                  Mayor: {majorCount}
                </span>
              )}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-neutral-600">Status</div>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="text-success" size={20} />
              <span className="font-semibold text-success">
                {statusLabel(paper.status)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="mb-8 flex gap-3 flex-wrap">
        <button
          onClick={handleAnalyze}
          disabled={isRunning}
          className="btn-primary flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Loader className="animate-spin" size={20} />
              Menganalisis…
            </>
          ) : (
            <>
              <BarChart3 size={20} />
              {hasResult ? "Analisis Ulang" : "Mulai Analisis"}
            </>
          )}
        </button>

        {hasResult && scoredParagraphs.length > 0 && (
          <button
            onClick={() => navigate(`/papers/${paperId}/revise`)}
            className="btn-secondary flex items-center gap-2"
          >
            <Zap size={20} />
            Mulai Revisi
          </button>
        )}

        <button onClick={() => navigate("/dashboard")} className="btn-tertiary">
          Kembali ke Dashboard
        </button>
      </div>

      {/* ── Progress bar (while analyzing) ── */}
      {isRunning && (
        <div className="card mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Loader className="animate-spin text-primary-600" size={18} />
                <h2 className="text-lg font-semibold text-neutral-900">
                  Analisis Sedang Berjalan
                </h2>
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                {analysisMessage || "Memproses makalah Anda… harap tunggu."}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                AI gratis membutuhkan jeda antar paragraf — estimasi 4–6 menit
                untuk 10 paragraf.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-neutral-900">
                {analysisProgress}%
              </div>
            </div>
          </div>
          <div className="mt-4 h-3 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-500"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Pre-analysis empty state ── */}
      {isDraft && !isRunning && (
        <div className="card text-center py-16">
          <PlayCircle className="mx-auto mb-4 text-primary-400" size={64} />
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Belum Ada Analisis
          </h2>
          <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
            Klik <strong>Mulai Analisis</strong> di atas untuk mengevaluasi
            kualitas sitasi, koherensi, keselarasan, dan kesenjangan penelitian
            pada tiap paragraf.
          </p>
          <button
            onClick={handleAnalyze}
            className="btn-primary inline-flex items-center gap-2 mx-auto"
          >
            <BarChart3 size={20} />
            Mulai Analisis Sekarang
          </button>
        </div>
      )}

      {/* ── Paragraph results (only when scored) ── */}
      {scoredParagraphs.length > 0 && (
        <div className="space-y-6 mt-2">
          <h2 className="text-xl font-semibold text-neutral-900">
            Analisis Per Paragraf
            {!hasResult && (
              <span className="ml-2 text-sm font-normal text-neutral-500">
                (sebagian hasil)
              </span>
            )}
          </h2>

          {scoredParagraphs.map((paragraph) => {
            const avgScore =
              (paragraph.citationScore +
                paragraph.coherenceScore +
                paragraph.alignmentScore +
                paragraph.researchGapScore) /
              4;
            const paragraphIssues = issuesByParagraph[paragraph.id] || [];

            return (
              <div key={paragraph.id} className="card overflow-hidden">
                {/* Paragraph header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Paragraf {paragraphs.indexOf(paragraph) + 1}
                    </h3>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {paragraph.originalText.length} karakter
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-neutral-900">
                        {avgScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-neutral-400">/10</div>
                    </div>
                    {paragraphIssues.length > 0 && (
                      <span className="px-3 py-1 rounded-full bg-orange-100 text-sm font-medium text-orange-700">
                        {paragraphIssues.length} masalah
                      </span>
                    )}
                  </div>
                </div>

                {/* Score grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {[
                    {
                      label: "Kualitas Sitasi",
                      value: paragraph.citationScore,
                    },
                    { label: "Koherensi", value: paragraph.coherenceScore },
                    { label: "Keselarasan", value: paragraph.alignmentScore },
                    {
                      label: "Kesenjangan Penelitian",
                      value: paragraph.researchGapScore,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 bg-neutral-50 rounded-lg">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {label}
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 mt-1">
                        {value.toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Text preview */}
                <div className="mb-5 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-sm text-neutral-700 line-clamp-3">
                    {paragraph.originalText}
                  </p>
                  <button
                    onClick={() =>
                      navigate(`/papers/${paperId}/revise?para=${paragraph.id}`)
                    }
                    className="text-primary-600 text-xs font-medium mt-2 hover:text-primary-700 transition"
                  >
                    Lihat Teks Lengkap & Edit →
                  </button>
                </div>

                {/* Issues */}
                {paragraphIssues.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-800">
                      Masalah & Saran:
                    </h4>
                    {paragraphIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-lg ${getSeverityBg(issue.severity)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {getSeverityIcon(issue.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-semibold uppercase">
                                {issueTypeLabel(issue.issueType)}
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${getSeverityBadge(issue.severity)}`}
                              >
                                {severityLabel(issue.severity)}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-800 mb-2">
                              {issue.description}
                            </p>
                            <div className="bg-white bg-opacity-60 p-2 rounded text-sm text-neutral-700 border-l-2 border-neutral-300">
                              <strong>Saran:</strong> {issue.suggestedAction}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 size={16} />
                      <span className="text-sm font-medium">
                        Tidak ada masalah yang ditemukan pada paragraf ini
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Next steps (after analysis) ── */}
      {hasResult && (
        <div className="card mt-8 bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Langkah Selanjutnya
          </h2>
          <ul className="space-y-2 text-neutral-800">
            {[
              "Tinjau masalah dan saran untuk setiap paragraf di atas.",
              'Klik "Mulai Revisi" untuk mengedit paragraf dengan panduan saran.',
              "Prioritaskan masalah Kritis dan Mayor terlebih dahulu.",
              "Simpan revisi dan jalankan analisis ulang untuk memantau perbaikan.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-bold text-primary-600 shrink-0">
                  {i + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
