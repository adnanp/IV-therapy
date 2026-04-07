#!/bin/bash
# Enrichment loop: processes 1 clinic every 20 minutes
# Run in background: nohup bash enrich_loop.sh >> enrich_loop.log 2>&1 &

cd /home/user/IV-therapy

while true; do
  echo "[$(date)] Starting enrichment run..."

  # Run the enrichment script
  python3 /home/user/IV-therapy/enrich_one.py

  EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Success. Sleeping 20 minutes..."
    sleep 1200
  elif [ $EXIT_CODE -eq 2 ]; then
    # Exit code 2 = all done
    echo "[$(date)] All clinics enriched! Loop complete."
    break
  else
    echo "[$(date)] Error (exit $EXIT_CODE). Sleeping 20 minutes before retry..."
    sleep 1200
  fi
done
