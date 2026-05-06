import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import RevisionPage from "../pages/RevisionPage";

vi.mock("../hooks/usePaperData", () => ({ usePaperData: vi.fn() }));
vi.mock("../services/paperService");
import * as usePaperDataModule from "../hooks/usePaperData";

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

const mockParagraph = {
  id: "para-1",
  versionId: "version-1",
  paragraphOrder: 0,
  originalText: "This is the original paragraph text.",
  revisedText: undefined,
  citationScore: 5.5,
  coherenceScore: 6.0,
  alignmentScore: 5.0,
  researchGapScore: 6.5,
  status: "needs_revision" as const,
  createdAt: new Date(),
};

const mockPaperData = {
  paper: {
    id: "paper-1",
    userId: "user-1",
    title: "Test Paper",
    originalContent: "Test content",
    currentVersionId: "version-1",
    status: "revision" as const,
    analysisProgress: 100,
    analysisMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  paragraphs: [mockParagraph],
  analysis: [],
  loading: false,
  error: null,
};

describe("RevisionPage MVP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePaperDataModule.usePaperData).mockReturnValue(mockPaperData);
  });

  it("should render revision editor with textarea", () => {
    renderWithRouter(<RevisionPage />);

    expect(screen.getByText(/editor revisi/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/edit paragraf/i)).toBeInTheDocument();
  });

  it("should display paragraph scores", () => {
    renderWithRouter(<RevisionPage />);

    expect(screen.getByText(/sitasi/i)).toBeInTheDocument();
    expect(screen.getByText(/koherensi/i)).toBeInTheDocument();
    expect(screen.getByText(/keselarasan/i)).toBeInTheDocument();
  });

  it("should load original text into editor initially", async () => {
    renderWithRouter(<RevisionPage />);

    const textarea = screen.getByPlaceholderText(
      /edit paragraf/i,
    ) as HTMLTextAreaElement;
    await waitFor(() => {
      expect(textarea.value).toBe(mockParagraph.originalText);
    });
  });

  it("should load revised text if it exists", async () => {
    const paragraphWithRevision = {
      ...mockParagraph,
      revisedText: "This is the revised paragraph text.",
    };

    vi.mocked(usePaperDataModule.usePaperData).mockReturnValue({
      ...mockPaperData,
      paragraphs: [paragraphWithRevision],
    });

    renderWithRouter(<RevisionPage />);

    const textarea = screen.getByPlaceholderText(
      /edit paragraf/i,
    ) as HTMLTextAreaElement;
    await waitFor(() => {
      expect(textarea.value).toBe(paragraphWithRevision.revisedText);
    });
  });

  it("should allow editing paragraph text", async () => {
    renderWithRouter(<RevisionPage />);

    const textarea = screen.getByPlaceholderText(
      /edit paragraf/i,
    ) as HTMLTextAreaElement;
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Teks revisi baru.");

    expect(textarea.value).toBe("Teks revisi baru.");
  });

  it("should have save button", () => {
    renderWithRouter(<RevisionPage />);

    const saveButton = screen.getByRole("button", {
      name: /simpan perubahan/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  it("should show save button as disabled initially with no changes", async () => {
    renderWithRouter(<RevisionPage />);

    const saveButton = screen.getByRole("button", {
      name: /simpan perubahan/i,
    });
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it("should enable save button when text changes", async () => {
    renderWithRouter(<RevisionPage />);

    const textarea = screen.getByPlaceholderText(/edit paragraf/i);
    const saveButton = screen.getByRole("button", {
      name: /simpan perubahan/i,
    });

    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Teks yang dimodifikasi");

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it("should have navigation buttons", () => {
    renderWithRouter(<RevisionPage />);

    expect(
      screen.getByRole("button", { name: /sebelumnya/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /berikutnya/i }),
    ).toBeInTheDocument();
  });

  it("should display paragraph counter", () => {
    renderWithRouter(<RevisionPage />);

    expect(screen.getByText(/paragraf 1 dari 1/i)).toBeInTheDocument();
  });

  it("should show back button to analysis", () => {
    renderWithRouter(<RevisionPage />);

    expect(
      screen.getByRole("button", { name: /kembali ke analisis/i }),
    ).toBeInTheDocument();
  });
});
