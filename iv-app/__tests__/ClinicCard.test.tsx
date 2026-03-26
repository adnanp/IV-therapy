import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClinicCard } from "@/components/ClinicCard";
import type { Clinic } from "@/lib/data";

// Mock Next.js Link to render a plain <a>
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const baseClinic: Clinic = {
  id: "1",
  slug: "test-clinic-seattle",
  name: "Test IV Clinic",
  streetAddress: "123 Main St",
  city: "Seattle",
  state: "WA",
  zip: "98101",
  phone: "+1 206-555-1234",
  website: "https://example.com",
  hours: JSON.stringify({ Monday: ["9AM-5PM"], Tuesday: ["9AM-5PM"], Wednesday: ["9AM-5PM"], Thursday: ["9AM-5PM"], Friday: ["9AM-5PM"], Saturday: ["Closed"], Sunday: ["Closed"] }),
  rating: 4.8,
  reviewCount: 120,
  categories: "IV therapy service",
  priceRange: "$$",
  description: null,
};

describe("ClinicCard", () => {
  it("renders the clinic name", () => {
    render(<ClinicCard clinic={baseClinic} />);
    expect(screen.getByText("Test IV Clinic")).toBeInTheDocument();
  });

  it("renders city and state", () => {
    render(<ClinicCard clinic={baseClinic} />);
    expect(screen.getByText("Seattle, WA")).toBeInTheDocument();
  });

  it("renders the price range", () => {
    render(<ClinicCard clinic={baseClinic} />);
    expect(screen.getByText("$$")).toBeInTheDocument();
  });

  it("renders the star rating", () => {
    render(<ClinicCard clinic={baseClinic} />);
    expect(screen.getByText("4.8")).toBeInTheDocument();
  });

  it("renders the review count", () => {
    render(<ClinicCard clinic={baseClinic} />);
    expect(screen.getByText("(120)")).toBeInTheDocument();
  });

  it("links to the correct clinic detail page", () => {
    render(<ClinicCard clinic={baseClinic} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/clinic/test-clinic-seattle");
  });

  it("displays formatted phone number", () => {
    render(<ClinicCard clinic={baseClinic} />);
    expect(screen.getByText("(206) 555-1234")).toBeInTheDocument();
  });

  it("does not crash when phone is null", () => {
    render(<ClinicCard clinic={{ ...baseClinic, phone: null }} />);
    expect(screen.getByText("Test IV Clinic")).toBeInTheDocument();
  });

  it("does not crash when rating is null", () => {
    render(<ClinicCard clinic={{ ...baseClinic, rating: null, reviewCount: null }} />);
    expect(screen.getByText("Test IV Clinic")).toBeInTheDocument();
  });

  it("shows IV therapy badge for IV therapy service category", () => {
    render(<ClinicCard clinic={baseClinic} />);
    expect(screen.getByText("IV Therapy")).toBeInTheDocument();
  });

  it("shows NAD+ badge when category includes nad", () => {
    render(<ClinicCard clinic={{ ...baseClinic, categories: "NAD+ therapy, IV therapy" }} />);
    expect(screen.getByText("NAD+")).toBeInTheDocument();
  });

  it("shows open/closed status when hours are provided", () => {
    render(<ClinicCard clinic={baseClinic} />);
    const status = screen.queryByText(/Open Now|Closed|Hours vary/);
    expect(status).not.toBeNull();
  });

  it("shows Hours vary when hours is null", () => {
    render(<ClinicCard clinic={{ ...baseClinic, hours: null }} />);
    expect(screen.getByText("Hours vary")).toBeInTheDocument();
  });
});
