import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button.js";
import { Chip } from "./chip.js";
import { Input } from "./form.js";
import { Alert } from "./alert.js";

describe("Button", () => {
  it("fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Find events</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Find events" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled", () => {
    render(<Button disabled>Next</Button>);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});

describe("Chip", () => {
  it("reflects selection via aria-pressed", () => {
    const { rerender } = render(<Chip selected>Free</Chip>);
    expect(screen.getByRole("button", { name: "Free" })).toHaveAttribute("aria-pressed", "true");
    rerender(<Chip>Free</Chip>);
    expect(screen.getByRole("button", { name: "Free" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("Input", () => {
  it("links label, error, and aria-invalid", () => {
    render(<Input label="City" error="City is required" required />);
    const input = screen.getByLabelText(/City/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("City is required");
  });
});

describe("Alert", () => {
  it("uses alert role for danger", () => {
    render(
      <Alert variant="danger" title="Cancelled">
        This event was cancelled.
      </Alert>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("cancelled");
  });
});
