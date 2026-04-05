#!/bin/bash
# Enrichment loop: processes 1 clinic every 20 minutes
# Run in background: nohup bash enrich_loop.sh > enrich_loop.log 2>&1 &

cd /home/user/IV-therapy

while true; do
  # Find next unenriched clinic
  NEXT=$(python3 -c "
import json, sys
c=json.load(open('iv-app/data/clinics.json'))
e=json.load(open('iv-app/data/enriched.json'))
u=[x for x in c if x['slug'] not in e]
if not u:
    print('DONE')
    sys.exit(0)
print(u[0]['slug'] + '|||' + u[0].get('website',''))
")

  if [ "$NEXT" = "DONE" ]; then
    echo "[$(date)] All clinics enriched. Loop complete."
    break
  fi

  SLUG=$(echo "$NEXT" | cut -d'|' -f1)
  WEBSITE=$(echo "$NEXT" | cut -d'|' -f4)

  echo "[$(date)] Enriching: $SLUG ($WEBSITE)"

  # Call claude CLI to enrich the clinic
  RESULT=$(claude --print "Research this IV therapy clinic and return enrichment data. Visit their website and look for: session duration, what's included, first visit info, recommended frequency, specialties/treatments offered, and pricing notes.

Clinic:
- slug: $SLUG
- website: $WEBSITE

Return ONLY valid JSON (no markdown, no explanation, no backticks):
{
  \"$SLUG\": {
    \"sessionDuration\": \"...\",
    \"whatIsIncluded\": \"...\",
    \"firstVisitInfo\": \"...\",
    \"frequency\": \"...\",
    \"specialties\": [\"...\"],
    \"priceNote\": \"...\"
  }
}

Use reasonable industry-norm values for any fields not found on the site. Specialties should be 3-6 treatment types." 2>&1)

  # Extract JSON from result (find the {...} block)
  JSON=$(echo "$RESULT" | python3 -c "
import sys, re, json
text = sys.stdin.read()
# Try to extract JSON object
match = re.search(r'\{[\s\S]*\}', text)
if match:
    try:
        obj = json.loads(match.group())
        print(json.dumps(obj))
    except:
        print('ERROR: bad json')
else:
    print('ERROR: no json found')
")

  if [[ "$JSON" == ERROR* ]]; then
    echo "[$(date)] ERROR parsing JSON for $SLUG: $JSON"
    echo "[$(date)] Raw result: $RESULT"
    echo "[$(date)] Waiting 20 minutes before retry..."
    sleep 1200
    continue
  fi

  # Merge into enriched.json
  python3 -c "
import json, sys
new = json.loads('''$JSON''')
with open('iv-app/data/enriched.json') as f:
    enriched = json.load(f)
enriched.update(new)
with open('iv-app/data/enriched.json', 'w') as f:
    json.dump(enriched, f, indent=2)
remaining = 0
c=json.load(open('iv-app/data/clinics.json'))
remaining = len([x for x in c if x['slug'] not in enriched])
print(f'Enriched: {len(enriched)}, Remaining: {remaining}')
"

  # Commit and push
  git add iv-app/data/enriched.json
  git commit -m "Enrich: $SLUG"
  git push -u origin claude/consolidate-iv-therapy-data-W2wOV

  echo "[$(date)] Done. Sleeping 20 minutes..."
  sleep 1200
done
