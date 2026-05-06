import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, ArrowRight, Clock, Loader2 } from "lucide-react";
import { Paper } from "../types";
import apiClient from "../utils/api";

function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "Tidak ada tanggal";
  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (!date || Number.isNaN(date.getTime())) return "Tanggal tidak valid";
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Tanggal tidak valid";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Draf";
    case "analyzing":
      return "Menganalisis";
    case "completed":
      return "Selesai";
    case "revision":
      return "Perlu Revisi";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function statusStyle(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "analyzing":
      return "bg-yellow-100 text-yellow-800";
    case "revision":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export default function DashboardPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await apiClient.get("/papers");
        setPapers(response.data.data || []);
      } catch (error) {
        console.error("Gagal memuat daftar makalah:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPapers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600 mt-1">
            Kelola dan analisis makalah penelitian Anda
          </p>
        </div>
        <button
          onClick={() => navigate("/upload")}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Unggah Makalah
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="text-sm text-neutral-600">Total Makalah</div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {papers.length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-neutral-600">Sedang Dianalisis</div>
          <div className="text-2xl font-bold text-warning mt-2">
            {papers.filter((p) => p.status === "analyzing").length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-neutral-600">Selesai</div>
          <div className="text-2xl font-bold text-success mt-2">
            {papers.filter((p) => p.status === "completed").length}
          </div>
        </div>
      </div>

      {/* Papers list */}
      <div className="card">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          Makalah Anda
        </h2>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2
              className="animate-spin inline-block text-primary-600"
              size={32}
            />
            <p className="text-neutral-500 mt-3">Memuat makalah…</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">
              Belum ada makalah. Mulai dengan mengunggah satu!
            </p>
            <button
              onClick={() => navigate("/upload")}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Unggah Makalah Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 hover:bg-neutral-50 transition cursor-pointer group"
                onClick={() => navigate(`/papers/${paper.id}/analysis`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition truncate">
                      {paper.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDate(paper.updatedAt)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle(paper.status)}`}
                      >
                        {statusLabel(paper.status)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    className="text-neutral-400 group-hover:text-primary-600 transition shrink-0"
                    size={20}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
