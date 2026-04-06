import type { Metadata } from "next";
import Link from "next/link";
import { Check, Star, Zap, Shield, Crown } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing for Clinic Owners — IVDirectory",
  description:
    "Claim and upgrade your IV therapy clinic listing. Get featured placement, lead tracking, and more patients finding you on IVDirectory.",
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: <Shield className="w-5 h-5" />,
    color: "gray",
    description: "Basic listing with your clinic's public information.",
    cta: "Current plan",
    ctaHref: null,
    ctaDisabled: true,
    features: [
      "Clinic name, address & phone",
      "Hours of operation",
      "Star ratings & reviews",
      "Search directory listing",
      "City page inclusion",
    ],
    missing: [
      "Featured placement",
      "Lead tracking & analytics",
      "Photo gallery",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    icon: <Zap className="w-5 h-5" />,
    color: "teal",
    description: "Enhanced profile to stand out and convert more visitors.",
    cta: "Get started",
    ctaHref: "mailto:hello@ivdirectory.com?subject=Pro Plan Inquiry",
    ctaDisabled: false,
    popular: false,
    features: [
      "Everything in Free",
      "Website link on listing",
      "Photo gallery (up to 10 photos)",
      "Staff & credentials section",
      "Service menu with descriptions",
      "Basic visit analytics (monthly)",
      "Treatment type badges",
    ],
    missing: [
      "Featured/pinned placement",
      "Homepage exposure",
    ],
  },
  {
    name: "Featured",
    price: "$99",
    period: "per month",
    icon: <Star className="w-5 h-5" />,
    color: "amber",
    description: "Pin your clinic to the top of search results and get maximum exposure.",
    cta: "Get featured",
    ctaHref: "mailto:hello@ivdirectory.com?subject=Featured Plan Inquiry",
    ctaDisabled: false,
    popular: true,
    features: [
      "Everything in Pro",
      "⭐ Featured badge on listing",
      "Pinned to top of search results",
      "City page featured placement",
      "Homepage \"Top Rated\" eligibility",
      "Weekly lead & click reports",
      "Priority listing in treatment filters",
    ],
    missing: [],
  },
  {
    name: "Premier",
    price: "$199",
    period: "per month",
    icon: <Crown className="w-5 h-5" />,
    color: "purple",
    description: "Maximum visibility with treatment sponsorships and booking integration.",
    cta: "Contact us",
    ctaHref: "mailto:hello@ivdirectory.com?subject=Premier Plan Inquiry",
    ctaDisabled: false,
    popular: false,
    features: [
      "Everything in Featured",
      "Sponsor a treatment category",
      "Homepage treatment card placement",
      "Email newsletter feature (1×/mo)",
      "Booking widget integration",
      "Real-time click & call tracking",
      "Dedicated account manager",
      "Custom clinic profile design",
    ],
    missing: [],
  },
];

const FAQS = [
  {
    q: "How do I claim my existing listing?",
    a: "Email us at hello@ivdirectory.com with your clinic name and we'll verify ownership and get you set up within 24 hours.",
  },
  {
    q: "What does 'featured placement' mean?",
    a: "Featured clinics appear at the top of search results for their city, above all standard listings. They also receive a ⭐ Featured badge that increases click-through rates.",
  },
  {
    q: "How many leads can I expect?",
    a: "It varies by city and competition. Featured clinics in active markets typically see 50–200 profile visits per month. We share detailed analytics so you can measure ROI.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — all plans are month-to-month with no contracts. Cancel anytime and your listing reverts to the Free tier.",
  },
  {
    q: "Do you offer a free trial?",
    a: "We offer a 30-day trial of the Featured plan for new clinic owners. Contact us to get started.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-950 to-teal-800 text-white px-4 py-20 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
          More Patients.<br />
          <span className="text-teal-300">Less Effort.</span>
        </h1>
        <p className="text-teal-100 text-lg max-w-xl mx-auto mb-6">
          IVDirectory is where patients search for IV therapy clinics.
          Get found, stand out, and grow your bookings.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-teal-200 font-medium">
          <span>✓ 275+ clinics listed</span>
          <span>✓ Growing patient community</span>
          <span>✓ Cancel anytime</span>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.popular
                    ? "border-amber-300 shadow-xl shadow-amber-100 bg-amber-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  plan.color === "amber" ? "bg-amber-100 text-amber-700" :
                  plan.color === "teal" ? "bg-teal-100 text-teal-700" :
                  plan.color === "purple" ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {plan.icon}
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h2>
                <div className="mb-2">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-sm ml-1">{plan.period}</span>
                </div>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">{plan.description}</p>

                {plan.ctaDisabled ? (
                  <button
                    disabled
                    className="w-full mb-6 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-default"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <a
                    href={plan.ctaHref!}
                    className={`w-full mb-6 py-2.5 rounded-xl text-sm font-bold text-center block transition-colors ${
                      plan.popular
                        ? "bg-amber-400 hover:bg-amber-500 text-amber-900"
                        : plan.color === "purple"
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                  >
                    {plan.cta}
                  </a>
                )}

                <div className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm text-gray-400 line-through">
                      <Check className="w-4 h-4 text-gray-200 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Why Clinics Choose IVDirectory</h2>
          <p className="text-gray-500 text-sm mb-10">Patients are actively searching for IV therapy near them. Be the first they find.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { stat: "275+", label: "Clinics in the directory" },
              { stat: "119", label: "City landing pages indexed" },
              { stat: "50–200", label: "Monthly profile views for featured clinics" },
            ].map(({ stat, label }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-3xl font-extrabold text-teal-600 mb-1">{stat}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="border border-gray-200 rounded-xl p-5 bg-white">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 bg-teal-700 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to grow your clinic?</h2>
        <p className="text-teal-100 text-sm mb-8 max-w-md mx-auto">
          Claim your listing today — it&apos;s free to start. Upgrade whenever you&apos;re ready.
        </p>
        <a
          href="mailto:hello@ivdirectory.com?subject=Claim My Listing"
          className="inline-block bg-white text-teal-700 font-bold px-8 py-3.5 rounded-xl hover:bg-teal-50 transition-colors text-sm"
        >
          Claim Your Free Listing →
        </a>
        <p className="text-teal-300 text-xs mt-4">
          Or email us at <span className="underline">hello@ivdirectory.com</span>
        </p>
      </section>

      {/* Back to directory */}
      <div className="text-center py-6 border-t border-gray-100">
        <Link href="/search" className="text-teal-600 hover:underline text-sm font-medium">
          ← Browse all clinics
        </Link>
      </div>
    </div>
  );
}
