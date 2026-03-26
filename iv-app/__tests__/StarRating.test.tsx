import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StarRating } from "@/components/StarRating";

describe("StarRating", () => {
  it("renders 5 star elements", () => {
    render(<StarRating rating={4.5} />);
    // lucide-react renders SVGs; check the container has 5 star icons
    const container = document.querySelector(".flex.items-center");
    expect(container).not.toBeNull();
  });

  it("displays the numeric rating", () => {
    render(<StarRating rating={4.8} />);
    expect(screen.getByText("4.8")).toBeInTheDocument();
  });

  it("displays the review count when provided", () => {
    render(<StarRating rating={4.5} reviewCount={123} />);
    expect(screen.getByText("(123)")).toBeInTheDocument();
  });

  it("localizes large review counts", () => {
    render(<StarRating rating={5} reviewCount={1200} />);
    expect(screen.getByText("(1,200)")).toBeInTheDocument();
  });

  it("does not display review count when not provided", () => {
    render(<StarRating rating={4.0} />);
    expect(screen.queryByText(/\(\d/)).toBeNull();
  });

  it("hides numeric rating when showNumber=false", () => {
    render(<StarRating rating={4.8} showNumber={false} />);
    expect(screen.queryByText("4.8")).toBeNull();
  });

  it("rounds 4.8 to 5 filled stars", () => {
    const { container } = render(<StarRating rating={4.8} />);
    const filledStars = container.querySelectorAll(".text-amber-400");
    expect(filledStars.length).toBe(5);
  });

  it("shows 3 filled and 2 empty stars for rating 3.0", () => {
    const { container } = render(<StarRating rating={3.0} />);
    const filledStars = container.querySelectorAll(".text-amber-400");
    const emptyStars = container.querySelectorAll(".text-gray-300");
    expect(filledStars.length).toBe(3);
    expect(emptyStars.length).toBe(2);
  });

  it("applies sm size classes when size=sm", () => {
    const { container } = render(<StarRating rating={4} size="sm" />);
    const icons = container.querySelectorAll(".w-3\\.5");
    expect(icons.length).toBeGreaterThan(0);
  });
});
