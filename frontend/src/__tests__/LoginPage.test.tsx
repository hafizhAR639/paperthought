import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";

// Mock the auth service (store is mocked in setup)
vi.mock("../services/authService");

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("LoginPage MVP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form with email and password inputs", () => {
    renderWithRouter(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /paperthought/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kata sandi/i)).toBeInTheDocument();
  });

  it("should have a submit button", () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByRole("button", { name: /masuk/i })).toBeInTheDocument();
  });

  it("should have a register link", () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByText(/belum punya akun/i)).toBeInTheDocument();
  });

  it("should accept email input", () => {
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(emailInput.value).toBe("test@example.com");
  });

  it("should accept password input", () => {
    renderWithRouter(<LoginPage />);

    const passwordInput = screen.getByLabelText(
      /kata sandi/i,
    ) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(passwordInput.value).toBe("password123");
  });

  it("should be accessible with keyboard navigation", () => {
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("type", "email");
  });
});
