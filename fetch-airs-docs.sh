#!/usr/bin/env bash
# Fetches the latest Prisma AIRS documentation PDFs from docs.paloaltonetworks.com

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)/airs-docs-pdfs"
BASE="https://docs.paloaltonetworks.com/content/dam/techdocs/en_US/pdf/ai-runtime-security"

PDFS=(
  "ai-runtime-security-activation-and-onboarding.pdf"
  "ai-runtime-security-administration.pdf"
  "ai-model-security.pdf"
  "ai-red-teaming.pdf"
  "ai-runtime-security-release-notes.pdf"
)

mkdir -p "$DIR"

for pdf in "${PDFS[@]}"; do
  printf "Downloading %s ... " "$pdf"
  if curl -sfL -o "$DIR/$pdf" "$BASE/$pdf"; then
    size=$(ls -lh "$DIR/$pdf" | awk '{print $5}')
    echo "OK ($size)"
  else
    echo "FAILED"
  fi
done

echo ""
echo "Done. Files saved to $DIR"
