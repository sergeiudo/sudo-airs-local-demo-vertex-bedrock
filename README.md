# SUDO AIRS Local Demo — Vertex & Bedrock

A React + Node.js demo of Prisma AIRS (AI Runtime Security) showing prompt/response scanning, model security scanning, and red teaming across Google Vertex AI and AWS Bedrock.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.10+ |

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd sudo-airs-local-demo-vertex-bedrock
npm install
```

### 2. Set up Python environment

The scanner process runs inside a Python virtual environment. Create it and install base dependencies (no credentials required):

```bash
python3 -m venv airs-model-scanner-main/.venv
airs-model-scanner-main/.venv/bin/pip install fastapi "uvicorn[standard]" requests python-dotenv python-multipart
```

This is required even if you're not using the Model Scanner — the scanner process starts in stub mode and still needs `fastapi` and `uvicorn` to run.

### 3. Configure credentials

```bash
cp .env.example .env
```

Open `.env` and fill in the values for the services you want to use. All three credential sections are independent — the app works with any combination of Vertex AI and Bedrock.

#### Prisma AIRS (required for protection mode)

Get these from [Strata Cloud Manager](https://stratacloudmanager.paloaltonetworks.com) → AI Security:

```
AIRS_API_KEY         # SCM → AI Security → API Applications
AIRS_PROFILE_NAME    # SCM → AI Security → Security Profiles
AIRS_BASE_URL        # Pick your region (US/EU/India/Singapore — see .env.example)
```

#### Google Vertex AI

```
GCP_PROJECT_ID       # Your GCP project ID
GCP_REGION           # e.g. us-central1
VERTEX_MODEL         # e.g. gemini-2.0-flash-001
GOOGLE_APPLICATION_CREDENTIALS   # Path to service account JSON key file
```

**Alternative to a key file:** run `gcloud auth application-default login` and leave `GOOGLE_APPLICATION_CREDENTIALS` blank.

Confirmed working model: `gemini-2.0-flash-001`. Versioned IDs like `gemini-1.5-pro-002` may 404 depending on your project.

#### AWS Bedrock

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION           # e.g. us-east-1
BEDROCK_MODEL_ID     # e.g. us.anthropic.claude-opus-4-6-v1:0
```

**STS temporary credentials** (keys starting with `ASIA`): also set `AWS_SESSION_TOKEN`. You can export it in your shell before running — dotenv will not overwrite already-exported variables:

```bash
export AWS_SESSION_TOKEN=<token>
npm run dev
```

**Bedrock model ID format:**
- Claude 4.x requires a cross-region inference profile ID: `us.anthropic.claude-opus-4-6-v1:0`
- Claude 3.x works with direct IDs: `anthropic.claude-3-5-sonnet-20241022-v2:0`

### 4. Run

```bash
npm run dev
```

This starts three processes concurrently:

| Port | Process |
|------|---------|
| 5173 | Vite dev server (React frontend) |
| 3001 | Express proxy (server.js) |
| 8001 | Python model scanner (scanner_server.py) |

Open [http://localhost:5173](http://localhost:5173).

---

## Optional: Model Scanner

The Model Scanning pillar requires a Prisma AIRS Model Security service account. Without it, the scanner starts in stub mode (returns helpful errors instead of crashing).

To enable it, add these to `.env`:

```
MODEL_SECURITY_CLIENT_ID
MODEL_SECURITY_CLIENT_SECRET
TSG_ID
LOCAL_SCAN_GROUP_UUID
HF_SCAN_GROUP_UUID       # optional, falls back to LOCAL_SCAN_GROUP_UUID
```

Then run the one-time setup:

```bash
bash setup-scanner.sh
```

This authenticates with Palo Alto Networks, retrieves a private PyPI URL, and installs the `model-security-client` SDK. Re-run only if credentials change.

---

## Troubleshooting

**Page goes blank / API returns nothing**

Stale processes may be holding ports. Kill them all before restarting:

```bash
lsof -ti tcp:3001 | xargs kill -9 2>/dev/null
lsof -ti tcp:5173 | xargs kill -9 2>/dev/null
lsof -ti tcp:8001 | xargs kill -9 2>/dev/null
npm run dev
```

**AWS: "on-demand throughput not supported"**

You're using a direct model ID for a Claude 4.x model. Switch to the cross-region inference profile format: `us.anthropic.claude-opus-4-6-v1:0`.

**AWS: authentication errors with ASIA keys**

Temporary STS credentials require `AWS_SESSION_TOKEN`. Export it in the same shell session before `npm run dev`.

**Vertex AI: 404 on model**

Only models explicitly enabled in your GCP project work. Verify in the Google Cloud Console → Vertex AI → Model Garden.
