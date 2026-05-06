import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  FileText,
  AlertCircle,
  FileUp,
} from "lucide-react";
import apiClient from "../utils/api";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() && !file) {
      setError("Judul wajib diisi jika tidak ada file yang dipilih");
      return;
    }
    if (!file && !content.trim()) {
      setError("Konten wajib diisi jika tidak ada file yang dipilih");
      return;
    }

    setIsLoading(true);
    try {
      const response = file
        ? await apiClient.post(
            "/papers/upload",
            (() => {
              const fd = new FormData();
              fd.append(
                "title",
                title.trim() || file!.name.replace(/\.[^.]+$/, ""),
              );
              fd.append("paperFile", file!);
              if (content.trim()) fd.append("content", content);
              return fd;
            })(),
          )
        : await apiClient.post("/papers/upload", { title, content });

      navigate(`/papers/${response.data.data.id}/analysis`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Unggahan gagal. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected && !title.trim())
      setTitle(selected.name.replace(/\.[^.]+$/, ""));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Unggah Makalah</h1>
        <p className="text-neutral-600 mt-2">
          Tempel konten makalah atau unggah file untuk memulai analisis
        </p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Judul Makalah
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul makalah Anda…"
              className="input-field"
              required={!file}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Konten Makalah
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tempel konten makalah di sini…"
              rows={15}
              className="input-field font-mono text-sm"
              required={!file}
            />

            {/* File upload zone */}
            <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-neutral-700">
                <FileUp size={18} className="text-primary-600 shrink-0" />
                <span>Atau unggah file PDF, DOCX, atau TXT</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-xs text-neutral-500">
                Batas: maks. 8.000 kata atau 50.000 karakter per makalah.
                Analisis membaca hingga 10 paragraf dan 3.000 karakter per
                paragraf.
              </p>
              {file && (
                <p className="mt-2 text-xs font-medium text-primary-700">
                  File dipilih: {file.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? "Mengunggah…" : "Unggah & Analisis"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn-secondary"
            >
              Batal
            </button>
          </div>
        </form>
      </div>

      {/* Info cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-neutral-200 rounded-lg bg-neutral-50">
          <FileText className="text-primary-600 mb-3" size={24} />
          <h3 className="font-semibold text-neutral-900 mb-2">
            Format yang Didukung
          </h3>
          <ul className="text-sm text-neutral-600 space-y-1">
            <li>✓ Teks biasa (paste langsung)</li>
            <li>✓ PDF</li>
            <li>✓ DOCX (Word)</li>
            <li>✓ TXT</li>
          </ul>
        </div>
        <div className="p-6 border border-neutral-200 rounded-lg bg-neutral-50">
          <UploadIcon className="text-primary-600 mb-3" size={24} />
          <h3 className="font-semibold text-neutral-900 mb-2">
            Apa yang Terjadi Selanjutnya?
          </h3>
          <p className="text-sm text-neutral-600">
            Makalah Anda akan dianalisis oleh AI (NVIDIA Nemotron via
            OpenRouter) untuk mengevaluasi kualitas sitasi, koherensi,
            keselarasan, dan kesenjangan penelitian pada tiap paragraf.
          </p>
        </div>
      </div>
    </div>
  );
}
