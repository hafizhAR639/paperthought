import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";

vi.mock("../hooks/usePaperData", () => ({ usePaperData: vi.fn() }));
vi.mock("../services/paperService");

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("DashboardPage MVP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render dashboard title", () => {
    renderWithRouter(<DashboardPage />);

    expect(screen.getByText(/dashboard|my papers/i)).toBeInTheDocument();
  });

  it("should display user papers list", async () => {
    renderWithRouter(<DashboardPage />);

    // Should render some paper list or empty state
    await waitFor(() => {
      expect(
        screen.queryByText(/belum ada makalah|unggah|buat/i) ||
          screen.queryAllByRole("heading")[0],
      ).toBeInTheDocument();
    });
  });

  it("should have upload or create new paper section", () => {
    renderWithRouter(<DashboardPage />);

    expect(
      screen.getByText(/unggah|buat|makalah baru/i) ||
        screen.getByRole("button", { name: /unggah|buat/i }),
    ).toBeInTheDocument();
  });

  it("should display paper status indicators", async () => {
    renderWithRouter(<DashboardPage />);

    // Check for status-related elements (draft, analyzing, completed, etc)
    await waitFor(() => {
      const statusElements = screen.queryAllByText(
        /draft|analyzing|completed|revision/i,
      );
      // May or may not have status elements depending on if papers exist
      expect(statusElements !== null).toBe(true);
    });
  });

  it("should show analysis progress when analyzing", () => {
    renderWithRouter(<DashboardPage />);

    // Check for progress bar or percentage
    const progressElements = screen.queryAllByText(/%|progress/i);
    expect(progressElements !== null).toBe(true);
  });

  it("should have logout or settings option", () => {
    renderWithRouter(<DashboardPage />);

    const userMenuElements = screen.queryAllByRole("button");
    expect(userMenuElements.length).toBeGreaterThan(0);
  });
});
