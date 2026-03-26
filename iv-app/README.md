# IVDirectory

A consumer-facing IV therapy clinic directory built with Next.js 16, Tailwind CSS, and Prisma (SQLite).

## Features

- **Homepage** — Hero search, featured cities, top-rated clinics
- **Search page** — Filter by city/state/zip, sort by rating or reviews
- **Clinic detail pages** — Full info: address, hours, services, map, contact, JSON-LD structured data
- **Sitemap** — Auto-generated at `/sitemap.xml`
- **317 pre-seeded clinics** from real Outscraper data

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env

# 3. Create database schema
npx prisma db push

# 4. Seed database from CSV
npx prisma db seed

# 5. Start dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Switching to PostgreSQL (Production)

1. Update `prisma/schema.prisma`: change `provider = "sqlite"` to `provider = "postgresql"`
2. Install Postgres adapter: `npm install @prisma/adapter-pg pg`
3. Update `lib/prisma.ts` to use `PrismaPg` adapter
4. Set `DATABASE_URL` to your Postgres connection string
5. Run `npx prisma db push && npx prisma db seed`

## Project Structure

```
app/
  page.tsx              # Homepage
  search/page.tsx       # Search results
  clinic/[slug]/page.tsx # Clinic detail
  sitemap.ts            # Auto sitemap
components/
  SearchBar.tsx
  ClinicCard.tsx
  SearchFilters.tsx
  StarRating.tsx
  ui/                   # button, badge, card, input
lib/
  prisma.ts             # Prisma client singleton
  utils.ts              # Helpers (formatPhone, isOpenNow, etc.)
prisma/
  schema.prisma
  seed.ts
data/
  clinics.csv           # Source data
```
