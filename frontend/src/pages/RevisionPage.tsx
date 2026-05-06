import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Loader,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { usePaperData } from "../hooks/usePaperData";
import { paperService } from "../services/paperService";

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

function severityLabel(s: string) {
  return s === "critical" ? "Kritis" : s === "major" ? "Mayor" : "Minor";
}

function severityBg(s: string) {
  return s === "critical"
    ? "bg-red-50 border border-red-200"
    : s === "major"
      ? "bg-orange-50 border border-orange-200"
      : "bg-yellow-50 border border-yellow-200";
}

function severityBadge(s: string) {
  return s === "critical"
    ? "bg-red-200 text-red-800"
    : s === "major"
      ? "bg-orange-200 text-orange-800"
      : "bg-yellow-200 text-yellow-800";
}

export default function RevisionPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    paper,
    paragraphs,
    analysis: analysisResults,
    loading,
  } = usePaperData(paperId || null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [editedText, setEditedText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  // Navigate to paragraph from URL query
  useEffect(() => {
    const paraId = searchParams.get("para");
    if (paraId && paragraphs.length > 0) {
      const idx = paragraphs.findIndex((p) => p.id === paraId);
      if (idx >= 0) {
        setCurrentIndex(idx);
        setEditedText(
          paragraphs[idx].revisedText ?? paragraphs[idx].originalText,
        );
      }
    }
  }, [searchParams, paragraphs]);

  // Sync text when paragraph changes
  useEffect(() => {
    if (paragraphs.length > 0) {
      setEditedText(
        paragraphs[currentIndex].revisedText ??
          paragraphs[currentIndex].originalText,
      );
    }
  }, [currentIndex, paragraphs]);

  const handleSave = async () => {
    if (!paperId || !paragraphs[currentIndex]) return;
    setIsSaving(true);
    try {
      await paperService.reviseParent(paragraphs[currentIndex].id, editedText);
      setSavedMessage("Paragraf berhasil disimpan!");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch {
      setSavedMessage("Gagal menyimpan paragraf");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <Loader className="animate-spin mx-auto mb-4" size={32} />
        <p className="text-neutral-600">Memuat editor revisi…</p>
      </div>
    );
  }

  if (!paper || paragraphs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-red-600 mb-4">Tidak ada paragraf untuk direvisi</p>
        <button
          onClick={() => navigate(`/papers/${paperId}`)}
          className="btn-primary"
        >
          Kembali ke Analisis
        </button>
      </div>
    );
  }

  const current = paragraphs[currentIndex];
  const paragraphIssues = analysisResults.filter(
    (a) => a.paragraphId === current.id,
  );
  const avgScore =
    (current.citationScore +
      current.coherenceScore +
      current.alignmentScore +
      current.researchGapScore) /
    4;
  const hasChanges = editedText !== current.originalText;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/papers/${paperId}`)}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 transition"
        >
          <ArrowLeft size={18} />
          Kembali ke Analisis
        </button>
        <h1 className="text-3xl font-bold text-neutral-900">{paper.title}</h1>
        <p className="text-neutral-600 mt-1">Editor Revisi</p>
      </div>

      {/* Navigation */}
      <div className="card mb-8">
        <div className="mb-3">
          <div className="text-sm text-neutral-600 mb-2">
            Paragraf {currentIndex + 1} dari {paragraphs.length}
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / paragraphs.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-4">
          <button
            onClick={() => {
              setCurrentIndex(currentIndex - 1);
              setSavedMessage("");
            }}
            disabled={currentIndex === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Sebelumnya
          </button>

          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900">
              {avgScore.toFixed(1)}/10
            </div>
            <div className="text-xs text-neutral-500">Skor Saat Ini</div>
          </div>

          <button
            onClick={() => {
              setCurrentIndex(currentIndex + 1);
              setSavedMessage("");
            }}
            disabled={currentIndex === paragraphs.length - 1}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Berikutnya
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor column */}
        <div className="lg:col-span-2">
          {/* Score breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Sitasi", value: current.citationScore },
              { label: "Koherensi", value: current.coherenceScore },
              { label: "Keselarasan", value: current.alignmentScore },
              { label: "Kesen. Riset", value: current.researchGapScore },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs font-medium text-neutral-500 uppercase">
                  {label}
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {value.toFixed(1)}
                </p>
              </div>
            ))}
          </div>

          {/* Text editor */}
          <div className="card">
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              Edit Teks Paragraf
              {hasChanges && <span className="text-orange-600 ml-2">*</span>}
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none"
              rows={10}
              placeholder="Edit paragraf Anda di sini…"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                {editedText.length} karakter
              </p>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>

            {savedMessage && (
              <div
                className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                  savedMessage.includes("berhasil")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {savedMessage.includes("berhasil") ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {savedMessage}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card sticky top-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Masalah & Saran
              {paragraphIssues.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                  {paragraphIssues.length}
                </span>
              )}
            </h3>

            {paragraphIssues.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-medium">
                    Tidak ada masalah ditemukan
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {paragraphIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-lg ${severityBg(issue.severity)}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle
                        className={
                          issue.severity === "critical"
                            ? "text-red-600"
                            : issue.severity === "major"
                              ? "text-orange-600"
                              : "text-yellow-600"
                        }
                        size={16}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold uppercase text-neutral-900">
                          {issueTypeLabel(issue.issueType)}
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded inline-block mt-0.5 ${severityBadge(issue.severity)}`}
                        >
                          {severityLabel(issue.severity)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-800 mb-2">
                      {issue.description}
                    </p>
                    <div className="text-xs bg-white bg-opacity-60 p-2 rounded border-l-2 border-neutral-300">
                      <strong className="text-neutral-900">Saran:</strong>
                      <p className="text-neutral-700 mt-0.5">
                        {issue.suggestedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="text-xs text-neutral-500 mb-3 font-medium uppercase">
                Status
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">
                    Status Paragraf
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      current.status === "needs_revision"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {current.status === "needs_revision"
                      ? "Perlu Revisi"
                      : "Disetujui"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">Perubahan</span>
                  <span
                    className={`text-xs font-medium ${hasChanges ? "text-orange-600" : "text-neutral-500"}`}
                  >
                    {hasChanges ? "Belum Disimpan" : "Tersimpan"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={() => navigate(`/papers/${paperId}`)}
          className="btn-secondary"
        >
          Selesai Mengedit
        </button>
        <button onClick={() => navigate("/dashboard")} className="btn-tertiary">
          Ke Dashboard
        </button>
      </div>
    </div>
  );
}
