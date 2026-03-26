import pandas as pd
import re
from collections import defaultdict

INPUT_FILE = '/home/user/IV-therapy/data.xlsx'
OUTPUT_FILE = '/home/user/IV-therapy/consolidated_iv_therapy.csv'

# Keywords that always KEEP a listing even if a removal pattern matches
KEEP_KEYWORDS = [
    'wellness', 'hydration', 'infusion', 'drip', 'lounge', 'med spa', 'medspa',
    'aesthetics', 'aesthetic', 'recovery', 'ketamine', 'nad', 'vitamin', 'boost',
    'iv therapy', 'iv lounge', 'iv bar', 'iv clinic', 'mobile iv'
]

# Patterns that indicate NOT an IV therapy provider (only used when 99% confident)
REMOVE_PATTERNS = [
    r'\bhospital\b', r'\bmedical center\b', r'\bemergency room\b', r'\b(er)\b',
    r'\burgent care\b', r'\bfamily practice\b', r'\bpediatric', r'\bob[\s-]?gyn\b',
    r'\bdental\b', r'\bdentist\b', r'\bordodontic', r'\borthodont', r'\bchiropractic\b',
    r'\bchiropractor\b', r'\bphysical therapy\b', r'\bpharmacy\b', r'\bdrugstore\b',
    r'\bdiagnostic', r'\bpathology\b', r'\bgym\b', r'\bfitness center\b',
    r'\bnail salon\b', r'\bhair salon\b', r'\bbarbershop\b', r'\bbarber shop\b',
    r'\btattoo\b', r'\bveterinary\b', r'\banimal hospital\b', r'\bpet clinic\b',
    r'\bcounseling\b', r'\bpsychology\b', r'\brestaurant\b', r'\bhotel spa\b',
    r'\bretail store\b'
]

def has_keep_keyword(name):
    name_lower = name.lower()
    return any(kw in name_lower for kw in KEEP_KEYWORDS)

def matches_remove_pattern(name):
    name_lower = name.lower()
    for pattern in REMOVE_PATTERNS:
        if re.search(pattern, name_lower):
            return True
    return False

def should_remove_by_name(name):
    if has_keep_keyword(name):
        return False
    return matches_remove_pattern(name)

def count_nonempty(row):
    return row.notna().sum()

def clean_sheet(df, sheet_name):
    total = len(df)
    removal_reasons = defaultdict(int)
    removed_indices = set()

    def remove(idx, reason):
        if idx not in removed_indices:
            removed_indices.add(idx)
            removal_reasons[reason] += 1

    for idx, row in df.iterrows():
        # Missing required fields
        name = str(row.get('name', '')).strip() if pd.notna(row.get('name')) else ''
        street = str(row.get('street', '')).strip() if pd.notna(row.get('street')) else ''
        city = str(row.get('city', '')).strip() if pd.notna(row.get('city')) else ''
        state = str(row.get('state_code', '')).strip() if pd.notna(row.get('state_code')) else ''
        hours = row.get('working_hours')

        if not name:
            remove(idx, 'Missing business name')
            continue
        if not street:
            remove(idx, 'Missing street address')
            continue
        if not city:
            remove(idx, 'Missing city')
            continue
        if not state:
            remove(idx, 'Missing state')
            continue
        if pd.isna(hours) or str(hours).strip() == '':
            remove(idx, 'Missing working hours')
            continue

        # Business status
        status = str(row.get('business_status', '')).upper()
        if 'CLOSED_PERMANENTLY' in status:
            remove(idx, 'Permanently closed')
            continue
        if 'CLOSED_TEMPORARILY' in status:
            remove(idx, 'Temporarily closed')
            continue

        # Review count threshold
        reviews = row.get('reviews')
        if pd.isna(reviews) or int(reviews) <= 10:
            remove(idx, '10 or fewer reviews')
            continue

        # Not an IV therapy provider
        if should_remove_by_name(name):
            remove(idx, 'Not an IV therapy provider (by name)')
            continue

    kept = df[~df.index.isin(removed_indices)].copy()

    # Map to output columns
    output = pd.DataFrame()
    output['business_name'] = kept['name']
    output['street_address'] = kept['street']
    output['city'] = kept['city']
    output['state'] = kept['state_code']
    output['zip_code'] = kept['postal_code']
    output['phone'] = kept['phone']
    output['website'] = kept['website']
    output['hours'] = kept['working_hours']
    output['rating'] = kept['rating']
    output['review_count'] = kept['reviews'].astype('Int64')
    output['categories'] = kept['subtypes'].fillna(kept['category'])
    output['source_file'] = sheet_name

    return output, total, len(output), removal_reasons

# --- Main ---
print("Reading XLSX...")
xl = pd.ExcelFile(INPUT_FILE)
all_frames = []
summary = []

for sheet in xl.sheet_names:
    df = pd.read_excel(INPUT_FILE, sheet_name=sheet)
    cleaned, before, after, reasons = clean_sheet(df, sheet)
    all_frames.append(cleaned)
    summary.append({
        'sheet': sheet,
        'before': before,
        'after': after,
        'removed': before - after,
        'reasons': reasons
    })
    print(f"  Sheet '{sheet}': {before} → {after} rows ({before - after} removed)")

# Merge
print("\nMerging all sheets...")
merged = pd.concat(all_frames, ignore_index=True)
total_before_dedup = len(merged)

# Deduplicate: same business_name + street_address (case-insensitive)
merged['_name_key'] = merged['business_name'].str.lower().str.strip()
merged['_addr_key'] = merged['street_address'].str.lower().str.strip()
merged['_nonempty'] = merged.apply(count_nonempty, axis=1)
merged_sorted = merged.sort_values('_nonempty', ascending=False)
deduped = merged_sorted.drop_duplicates(subset=['_name_key', '_addr_key'], keep='first')
deduped = deduped.drop(columns=['_name_key', '_addr_key', '_nonempty'])
deduped = deduped.reset_index(drop=True)

duplicates_removed = total_before_dedup - len(deduped)
print(f"Duplicates removed: {duplicates_removed}")
print(f"Final row count: {len(deduped)}")

deduped.to_csv(OUTPUT_FILE, index=False)
print(f"\nSaved to {OUTPUT_FILE}")

# --- Summary Report ---
print("\n" + "="*60)
print("SUMMARY REPORT")
print("="*60)
print(f"\n{'Sheet':<40} {'Before':>8} {'After':>8} {'Removed':>8}")
print("-"*66)
for s in summary:
    print(f"{s['sheet']:<40} {s['before']:>8} {s['after']:>8} {s['removed']:>8}")
print("-"*66)
print(f"{'TOTAL (before dedup)':<40} {sum(s['before'] for s in summary):>8} {sum(s['after'] for s in summary):>8} {sum(s['removed'] for s in summary):>8}")
print(f"\nDuplicates removed after merge: {duplicates_removed}")
print(f"Final consolidated dataset:     {len(deduped)} rows")

print("\nTop removal reasons (across all sheets):")
all_reasons = defaultdict(int)
for s in summary:
    for reason, count in s['reasons'].items():
        all_reasons[reason] += count
for reason, count in sorted(all_reasons.items(), key=lambda x: -x[1]):
    print(f"  {count:>5}  {reason}")
