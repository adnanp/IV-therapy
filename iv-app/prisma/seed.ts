import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import path from "path";
import slugify from "slugify";

const dbPath = path.join(__dirname, "../dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as never);

interface CsvRow {
  business_name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  website: string;
  hours: string;
  rating: string;
  review_count: string;
  categories: string;
  source_file: string;
}

function makeSlug(name: string, city: string): string {
  const base = slugify(`${name} ${city}`, { lower: true, strict: true });
  return base.slice(0, 100);
}

function safeFloat(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function safeInt(val: string): number | null {
  const n = parseInt(val);
  return isNaN(n) ? null : n;
}

function safeStr(val: string): string | null {
  const s = val?.trim();
  return s && s !== "" && s.toLowerCase() !== "nan" && s.toLowerCase() !== "none" ? s : null;
}

function cleanZip(zip: string): string {
  if (!zip) return "";
  // Remove ".0" suffix from floats parsed from CSV
  return zip.replace(/\.0$/, "").trim();
}

async function main() {
  const csvPath = path.join(__dirname, "../data/clinics.csv");
  const rows: CsvRow[] = [];

  await new Promise<void>((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on("data", (row: CsvRow) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Read ${rows.length} rows from CSV`);

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.image.deleteMany();
  await prisma.service.deleteMany();
  await prisma.clinic.deleteMany();

  let seeded = 0;
  let skipped = 0;
  const slugsSeen = new Set<string>();

  for (const row of rows) {
    const name = safeStr(row.business_name);
    const street = safeStr(row.street_address);
    const city = safeStr(row.city);
    const state = safeStr(row.state);

    if (!name || !street || !city || !state) {
      skipped++;
      continue;
    }

    let slug = makeSlug(name, city);
    // Ensure uniqueness
    if (slugsSeen.has(slug)) {
      slug = `${slug}-${seeded + 1}`;
    }
    slugsSeen.add(slug);

    try {
      await prisma.clinic.create({
        data: {
          slug,
          name,
          streetAddress: street,
          city,
          state,
          zip: cleanZip(row.zip_code || ""),
          phone: safeStr(row.phone),
          website: safeStr(row.website),
          hours: safeStr(row.hours),
          rating: safeFloat(row.rating),
          reviewCount: safeInt(row.review_count),
          categories: safeStr(row.categories),
          priceRange: "$$",
        },
      });
      seeded++;
    } catch (err) {
      console.error(`Failed to seed: ${name}`, err);
      skipped++;
    }
  }

  console.log(`✅ Seeded ${seeded} clinics successfully`);
  if (skipped > 0) console.log(`⚠️  Skipped ${skipped} rows`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
