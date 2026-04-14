#!/usr/bin/env python3
"""
Daily blog generator for IVDirectory.
Researches Reddit, recent discussions, and uses Claude to write
a well-researched, engaging blog post. Runs via GitHub Actions.

Requires env vars:
  ANTHROPIC_API_KEY — for Claude article writing
"""

import json
import os
import re
import sys
import urllib.request
import urllib.parse
from datetime import date
from pathlib import Path

BASE = Path(__file__).parent.parent  # repo root
BLOG_FILE = BASE / "iv-app/data/blog-posts.json"
TOPICS_FILE = BASE / "scripts/blog-topics.json"

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# ─── TOPIC QUEUE ──────────────────────────────────────────────────────────────

DEFAULT_TOPICS = [
    "glutathione IV therapy skin benefits whitening glow",
    "vitamin C high dose IV therapy immune cancer research 2024",
    "NAD+ IV therapy addiction recovery clinical results",
    "IV therapy for chronic fatigue syndrome fibromyalgia",
    "Myers Cocktail vs oral supplements bioavailability comparison",
    "magnesium IV therapy anxiety migraines benefits",
    "B12 injections vs IV therapy which is better",
    "IV therapy athletic recovery sports performance NFL NBA",
    "hydration IV therapy vs drinking water dehydration",
    "ketamine IV therapy depression mental health",
    "IV therapy for long covid recovery symptoms",
    "zinc IV therapy immune boost cold flu prevention",
    "amino acid IV therapy muscle building weight loss",
    "IV therapy anti-aging longevity protocol celebrities",
    "taurine IV therapy heart health energy benefits",
    "phosphatidylcholine IV therapy brain health liver detox",
    "IV therapy pregnancy safety what to know",
    "mobile IV therapy at home benefits convenience",
    "IV therapy hangover cure science does it work",
    "ozone IV therapy alternative treatment benefits risks",
    "alpha lipoic acid IV therapy neuropathy diabetes",
    "selenium IV therapy thyroid immune benefits",
    "IV therapy cost worth it vs supplements comparison",
    "biotin IV therapy hair skin nails beauty benefits",
    "iron IV infusion anemia treatment vs pills",
    "vitamin D IV therapy deficiency sunshine alternatives",
    "EDTA chelation IV therapy heavy metals detox",
    "hydrogen peroxide IV therapy alternative cancer treatment",
    "IV therapy frequency how often should you go",
    "IV therapy side effects risks what to watch for",
]


def load_topics() -> dict:
    if TOPICS_FILE.exists():
        return json.loads(TOPICS_FILE.read_text())
    return {"used": [], "queue": DEFAULT_TOPICS.copy()}


def save_topics(topics: dict):
    TOPICS_FILE.write_text(json.dumps(topics, indent=2))


def pick_topic(topics: dict) -> str:
    if not topics["queue"]:
        # Reset queue, avoid last 5 used
        topics["queue"] = [t for t in DEFAULT_TOPICS if t not in topics["used"][-5:]]
    topic = topics["queue"].pop(0)
    topics["used"].append(topic)
    return topic


# ─── REDDIT RESEARCH ──────────────────────────────────────────────────────────

def fetch_reddit(topic: str) -> str:
    """Fetch top Reddit discussions about the topic."""
    keywords = topic.split()[:3]
    query = "+".join(keywords)
    subreddits = ["ivtherapy", "wellness", "longevity", "Nootropics", "naturopathy", "askdocs"]
    snippets = []

    for sub in subreddits[:3]:
        url = f"https://www.reddit.com/r/{sub}/search.json?q={urllib.parse.quote(query)}&sort=relevance&limit=5&t=year"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "IVDirectory-Research/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
            posts = data.get("data", {}).get("children", [])
            for post in posts[:2]:
                p = post["data"]
                title = p.get("title", "")
                selftext = p.get("selftext", "")[:300]
                score = p.get("score", 0)
                if title and score > 5:
                    snippets.append(f"Reddit r/{sub}: \"{title}\" (score:{score}) — {selftext}")
        except Exception:
            pass

    return "\n".join(snippets[:6]) if snippets else ""


# ─── BLOG WRITING VIA CLAUDE ──────────────────────────────────────────────────

def write_blog_post(topic: str, reddit_context: str) -> dict | None:
    """Use Claude to write a comprehensive blog post."""

    existing = json.loads(BLOG_FILE.read_text())
    existing_titles = [p["title"] for p in existing]
    existing_slugs = [p["slug"] for p in existing]

    reddit_section = f"""
Here are some real discussions from Reddit and wellness communities about this topic:
{reddit_context}
""" if reddit_context else ""

    system_prompt = """You are the lead content writer for IVDirectory, the go-to resource for IV therapy education.
Your writing is:
- Evidence-informed but accessible (cite real research trends, not invented studies)
- Engaging and conversational, not clinical or dry
- Honest about what we know vs. what's emerging
- Practical — readers want to know "should I do this and why"
- Formatted for web: clear H2 sections, no walls of text

You always write from the perspective of someone who has deeply researched the topic from medical journals, Reddit communities, influencer content, and clinical experience."""

    user_prompt = f"""Write a new blog post for IVDirectory about: {topic}

{reddit_section}

EXISTING ARTICLES (don't duplicate these):
{chr(10).join(existing_titles)}

Requirements:
1. Write a compelling title that would rank on Google and get clicks
2. Write a 2-sentence excerpt/meta description
3. Pick ONE category from: Treatments, Wellness, Guides, Science, Trends
4. Estimate read time (3-8 min)
5. Write 5-7 H2 sections with substantive paragraphs (150-250 words each)
6. Include what real people are saying (Reddit insights, common questions)
7. Be honest about evidence strength — distinguish proven vs. emerging
8. End with a practical takeaway

Return a JSON object with this exact structure:
{{
  "slug": "url-friendly-slug-here",
  "title": "Article Title Here",
  "excerpt": "Two sentence excerpt for SEO and article listing.",
  "category": "Treatments",
  "readTime": "5 min read",
  "publishedAt": "{date.today().isoformat()}",
  "content": [
    {{"type": "p", "text": "Opening paragraph..."}},
    {{"type": "h2", "text": "Section Title"}},
    {{"type": "p", "text": "Section content..."}},
    ... more blocks
  ]
}}

Return ONLY the JSON, no markdown code blocks, no other text."""

    payload = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 4000,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }).encode()

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  Claude API error: {e.code} — {e.read().decode()[:200]}")
        return None

    text = result["content"][0]["text"].strip()

    # Strip markdown code blocks if present
    text = re.sub(r'^```json\s*', '', text)
    text = re.sub(r'\s*```$', '', text)

    try:
        post = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e}")
        print(f"  Raw response: {text[:300]}")
        return None

    # Ensure slug is unique
    base_slug = post.get("slug", "")
    slug = base_slug
    i = 2
    while slug in existing_slugs:
        slug = f"{base_slug}-{i}"
        i += 1
    post["slug"] = slug

    return post


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    topics = load_topics()
    topic = pick_topic(topics)
    save_topics(topics)

    print(f"Topic: {topic}")

    print("Fetching Reddit context...")
    reddit_context = fetch_reddit(topic)
    print(f"  Got {len(reddit_context)} chars of Reddit context")

    print("Writing blog post with Claude...")
    post = write_blog_post(topic, reddit_context)

    if not post:
        print("Failed to generate post")
        sys.exit(1)

    print(f"  Title: {post['title']}")
    print(f"  Slug: {post['slug']}")
    print(f"  Sections: {len(post.get('content', []))}")

    # Append to blog-posts.json (newest first)
    posts = json.loads(BLOG_FILE.read_text())
    posts.insert(0, post)
    BLOG_FILE.write_text(json.dumps(posts, indent=2))

    print(f"\nDone! Blog now has {len(posts)} articles.")
    print(f"New article: /blog/{post['slug']}")


if __name__ == "__main__":
    main()
