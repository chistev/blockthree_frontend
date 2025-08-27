import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InputField from "../components/InputField";

describe("InputField", () => {
  const defaultProps = {
    label: "Test Label",
    value: 1000,
    onChange: vi.fn(),
    suffix: "USD",
    tooltip: "Tooltip text",
    darkMode: false,
  };

  it("renders correctly with label, value, and suffix", () => {
    render(<InputField {...defaultProps} />);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1000")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("shows tooltip when provided", () => {
    render(<InputField {...defaultProps} />);
    expect(screen.getByTitle("Tooltip text")).toBeInTheDocument();
  });

  it("updates local value when typing valid number", () => {
    render(<InputField {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "2000" } });
    expect(input.value).toBe("2000");
  });

  it("ignores invalid input by keeping the current value", () => {
    render(<InputField {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input.value).toBe("abc"); // Local value updates, but onBlur will handle it
    fireEvent.blur(input);
    expect(defaultProps.onChange).toHaveBeenCalledWith(0); // Invalid input → 0 on blur
  });

  it("calls onChange with parsed value on blur", () => {
    const onChange = vi.fn();
    render(<InputField {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "1500.75" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(1500.75);
  });

  it("handles empty input by calling onChange with 0 on blur", () => {
    const onChange = vi.fn();
    render(<InputField {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("applies dark mode classes when darkMode=true", () => {
    render(<InputField {...defaultProps} darkMode />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("bg-slate-700");
    expect(input.className).toContain("border-slate-600");
    expect(input.className).toContain("text-white");
  });
});