"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, RotateCcw, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    id: "goal",
    question: "What's your main goal today?",
    options: [
      { label: "Boost my energy", value: "energy" },
      { label: "Fight off sickness", value: "immune" },
      { label: "Recover from a rough night", value: "hangover" },
      { label: "Look and feel beautiful", value: "beauty" },
      { label: "Athletic performance or recovery", value: "athletic" },
      { label: "Brain health & longevity", value: "brain" },
    ],
  },
  {
    id: "urgency",
    question: "How quickly do you want to feel results?",
    options: [
      { label: "Right now — I need relief fast", value: "fast" },
      { label: "Today is fine", value: "today" },
      { label: "I'm investing in long-term wellness", value: "longterm" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget per session?",
    options: [
      { label: "Under $150", value: "low" },
      { label: "$150 – $300", value: "mid" },
      { label: "$300+, I want the best", value: "high" },
    ],
  },
]

interface Recommendation {
  treatment: string
  specialty: string
  emoji: string
  headline: string
  why: string
}

function getRecommendation(answers: Record<string, string>): Recommendation {
  const { goal, urgency, budget } = answers

  if (goal === "brain" || budget === "high") {
    return {
      treatment: "NAD+ Therapy",
      specialty: "nad",
      emoji: "🧠",
      headline: "NAD+ Therapy is your match",
      why: "NAD+ is the gold standard for cellular energy, anti-aging, and cognitive performance. Sessions run 2–4 hours and deliver deep, lasting results.",
    }
  }
  if (goal === "hangover" || urgency === "fast") {
    return {
      treatment: "Hangover Recovery",
      specialty: "hangover",
      emoji: "⚡",
      headline: "Hangover Recovery IV is your match",
      why: "Fluids, B-vitamins, anti-nausea medication, and electrolytes delivered straight to your bloodstream. You'll feel human again within an hour.",
    }
  }
  if (goal === "immune" || urgency === "today") {
    return {
      treatment: "Immune Boost",
      specialty: "immune",
      emoji: "🛡️",
      headline: "Immune Boost IV is your match",
      why: "High-dose Vitamin C, Zinc, and antioxidants flood your system to fight off illness and supercharge your immune response.",
    }
  }
  if (goal === "beauty") {
    return {
      treatment: "Beauty & Glow",
      specialty: "beauty",
      emoji: "✨",
      headline: "Beauty & Glow IV is your match",
      why: "Glutathione, Biotin, and Vitamin C work together to brighten your skin, strengthen hair and nails, and give you that lit-from-within glow.",
    }
  }
  if (goal === "athletic") {
    return {
      treatment: "Athletic Recovery",
      specialty: "athletic",
      emoji: "💪",
      headline: "Athletic Recovery IV is your match",
      why: "Amino acids, Magnesium, and electrolytes delivered directly to your muscles to reduce soreness, speed recovery, and boost performance.",
    }
  }
  // Default: Myers Cocktail
  return {
    treatment: "Myers' Cocktail",
    specialty: "myers",
    emoji: "💧",
    headline: "Myers' Cocktail is your match",
    why: "The most popular IV drip in the world. Magnesium, B vitamins, Calcium, and Vitamin C — a proven formula for energy, immunity, and overall wellness.",
  }
}

export function TreatmentQuiz() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Recommendation | null>(null)

  function selectOption(stepId: string, value: string) {
    const newAnswers = { ...answers, [stepId]: value }
    setAnswers(newAnswers)

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setResult(getRecommendation(newAnswers))
    }
  }

  function reset() {
    setCurrentStep(0)
    setAnswers({})
    setResult(null)
  }

  const step = STEPS[currentStep]
  const progress = ((currentStep) / STEPS.length) * 100

  if (result) {
    return (
      <div className="bg-white rounded-2xl border border-teal-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-8 text-white text-center">
          <div className="text-5xl mb-3">{result.emoji}</div>
          <h3 className="text-xl font-bold mb-1">{result.headline}</h3>
          <p className="text-teal-100 text-sm leading-relaxed max-w-sm mx-auto">{result.why}</p>
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push(`/search?specialty=${result.specialty}`)}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            Find {result.treatment} Clinics <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={reset}
            className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retake
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-1 bg-teal-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 text-xs text-teal-600 font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Question {currentStep + 1} of {STEPS.length}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-5">{step.question}</h3>
        <div className="space-y-2">
          {step.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectOption(step.id, opt.value)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                answers[step.id] === opt.value
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
