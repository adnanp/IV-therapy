#!/bin/bash
# Tries to generate clinic images every 3 hours.
# If Google blocks the request (403), waits and retries next cycle.
# Run in background: nohup bash image_gen_loop.sh >> image_gen.log 2>&1 &

cd /home/user/IV-therapy

GEMINI_API_KEY="AIzaSyBkSeHHDwXsFtCpzz7aJ7gAJ52xcZbQ4cw"
export GEMINI_API_KEY

SLEEP_SECONDS=10800  # 3 hours

while true; do
  echo "[$(date)] Attempting image generation..."

  OUTPUT=$(python3 generate_clinic_images.py 2>&1)
  echo "$OUTPUT"

  if echo "$OUTPUT" | grep -q "Done!"; then
    echo "[$(date)] Success! Sleeping 3 hours before next image..."
    sleep $SLEEP_SECONDS
  elif echo "$OUTPUT" | grep -q "All clinics processed"; then
    echo "[$(date)] All 273 clinics have images! Loop complete."
    break
  elif echo "$OUTPUT" | grep -q "403"; then
    echo "[$(date)] Google blocked request (403). Retrying in 3 hours..."
    sleep $SLEEP_SECONDS
  else
    echo "[$(date)] Unknown result. Retrying in 3 hours..."
    sleep $SLEEP_SECONDS
  fi
done
