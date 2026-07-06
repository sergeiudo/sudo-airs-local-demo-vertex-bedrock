#!/bin/bash
# ─── Prisma AIRS Model Security SDK installer ────────────────────────────────
# Authenticates with Palo Alto Networks and installs the private model-security-client SDK.
# Run this once after setting credentials in .env
#
# Usage: bash setup-scanner.sh
#

set -euo pipefail

# Load .env (robust: ignores comment/blank lines, strips inline comments, and never
# executes file contents — safe with values containing spaces, '#', '$( )', etc.)
if [ -f .env ]; then
  while IFS= read -r _line || [ -n "$_line" ]; do
    _line="${_line%$'\r'}"                                 # strip CR (CRLF files)
    case "$_line" in ''|[!A-Za-z_]*) continue ;; esac      # skip blanks + comment/non-var lines
    _key="${_line%%=*}"
    case "$_key" in *[!A-Za-z0-9_]*) continue ;; esac      # key must be a valid identifier
    _val="${_line#*=}"
    _val="${_val%% #*}"                                    # strip trailing " # inline comment"
    _val="${_val%"${_val##*[![:space:]]}"}"               # trim trailing whitespace
    _val="${_val#\"}"; _val="${_val%\"}"                  # strip surrounding double quotes
    _val="${_val#\'}"; _val="${_val%\'}"                  # strip surrounding single quotes
    export "$_key=$_val"
  done < .env
  unset _line _key _val
fi

: "${MODEL_SECURITY_CLIENT_ID:?Missing MODEL_SECURITY_CLIENT_ID in .env}"
: "${MODEL_SECURITY_CLIENT_SECRET:?Missing MODEL_SECURITY_CLIENT_SECRET in .env}"
: "${TSG_ID:?Missing TSG_ID in .env}"

API_ENDPOINT="${MODEL_SECURITY_API_ENDPOINT:-https://api.sase.paloaltonetworks.com/aims}"
TOKEN_ENDPOINT="${MODEL_SECURITY_TOKEN_ENDPOINT:-https://auth.apps.paloaltonetworks.com/oauth2/access_token}"

echo "→ Authenticating with Palo Alto Networks..."
TOKEN_RESPONSE=$(curl -sf -X POST "$TOKEN_ENDPOINT" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "$MODEL_SECURITY_CLIENT_ID:$MODEL_SECURITY_CLIENT_SECRET" \
  -d "grant_type=client_credentials&scope=tsg_id:$TSG_ID") || {
  echo "✗ Failed to obtain access token — check MODEL_SECURITY_CLIENT_ID / MODEL_SECURITY_CLIENT_SECRET"
  exit 1
}

SCM_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "✓ Access token obtained"

echo "→ Getting private PyPI URL..."
PYPI_RESPONSE=$(curl -sf -X GET "$API_ENDPOINT/mgmt/v1/pypi/authenticate" \
  -H "Authorization: Bearer $SCM_TOKEN") || {
  echo "✗ Failed to retrieve PyPI URL — is AIRS Model Security enabled in your SCM tenant?"
  exit 1
}

PYPI_URL=$(echo "$PYPI_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['url'])")
echo "✓ Private PyPI URL retrieved"

echo "→ Setting up .venv and installing dependencies..."
VENV=airs-model-scanner-main/.venv
if [ ! -d "$VENV" ]; then
  python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install fastapi "uvicorn[standard]" requests python-dotenv python-multipart 2>&1 | tail -3
"$VENV/bin/pip" install --extra-index-url "$PYPI_URL" model-security-client 2>&1 | tail -3
echo "✓ model-security-client installed"

echo ""
echo "✓ Setup complete. Run 'npm run dev' to start all services including the model scanner."
