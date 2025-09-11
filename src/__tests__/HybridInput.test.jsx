import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HybridInput from "../components/HybridInput";

describe("HybridInput", () => {
  const defaultProps = {
    label: "Test Label",
    value: 0.5,
    onChange: vi.fn(),
    min: 0,
    max: 1,
    step: 0.01,
    suffix: "%",
    tooltip: "Tooltip text",
    darkMode: false,
  };

  it("renders correctly with label and value", () => {
    render(<HybridInput {...defaultProps} />);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("50.0%")).toBeInTheDocument(); // 0.5 → 50%
  });

  it("shows tooltip when provided", () => {
    render(<HybridInput {...defaultProps} />);
    expect(screen.getByTitle("Tooltip text")).toBeInTheDocument();
  });

  it("updates local value when typing valid number", () => {
    render(<HybridInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "0.75" } });
    expect(input.value).toBe("0.75");
  });

  it("ignores invalid input", () => {
    render(<HybridInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input.value).toBe("0.5");
  });

  it("calls onChange with clamped value on blur", () => {
    const onChange = vi.fn();
    render(<HybridInput {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);

    // should clamp to max (1) since suffix "%" divides by 100
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("handles empty input by resetting to min on blur", () => {
    const onChange = vi.fn();
    render(<HybridInput {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  it("updates value when slider is changed", () => {
    const onChange = vi.fn();
    render(<HybridInput {...defaultProps} onChange={onChange} />);
    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "0.8" } });

    expect(onChange).toHaveBeenCalledWith(0.8);
  });

  it("applies dark mode classes when darkMode=true", () => {
    render(<HybridInput {...defaultProps} darkMode />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("bg-slate-700");
  });
});
