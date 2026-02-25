# SUDO AIRS Local Demo — Vertex & Bedrock

**Created by Sergei (SUDO) Udovenko, Palo Alto Networks**

An interactive demo that shows how **Prisma AI Runtime Security (AIRS)** protects AI applications from attacks — and what happens when it doesn't. Toggle protection on and off in real time to compare a vulnerable deployment against a secured one, using live LLMs on Google Vertex AI and AWS Bedrock.

![Home screen — three pillars](docs/screenshot-home.png)

![API Intercept — DAN attack blocked by AIRS](docs/screenshot-api-intercept.png)

---

## What This Demo Shows

AI systems face security threats that traditional tools weren't built for: malicious prompts designed to manipulate model behavior, compromised model files distributed through public registries, and adversarial inputs that slowly erode a model's guardrails across a conversation. This demo makes those threats tangible and shows how AIRS addresses each one.

The demo is built around three pillars, each accessible from the home screen:

### Pillar 1 — API Intercept

Simulates real attacks against a live LLM (prompt injection, jailbreaks, data exfiltration attempts) and shows AIRS scanning every request and response in the traffic path.

With **protection on**, AIRS evaluates the prompt before it reaches the model. If the prompt is malicious, it's blocked and the LLM is never called. If it passes, AIRS also scans the model's response before it's returned to the user. The telemetry panel shows the full scan result — verdict, threat category, latency, token counts — and links directly to the transaction in Strata Cloud Manager.

With **protection off**, the same attacks go straight through to the LLM with no inspection. The model's response is returned unfiltered.

The attack library on the left contains curated examples across categories (prompt injection, jailbreak, data exfiltration) that you can fire one-click against Vertex AI (Gemini) or Bedrock (Claude).

### Pillar 2 — Model Scanning

Scans AI model files for embedded threats before they're deployed — malware, backdoors, pickle exploits, and unsafe tensor serialization.

You can submit a model two ways: paste a HuggingFace model URI (e.g. `org/model-name`) or upload a local file. The Prisma AIRS Model Security SDK submits it to a scan group in your tenant and returns a vulnerability report with rule violations and CVE matches.

> Requires Model Security credentials (`bash setup-scanner.sh`). Without them the scanner starts in stub mode and this pillar shows a "not configured" message.

### Pillar 3 — Red Teaming

Runs automated adversarial campaigns across multiple attack categories — DAN variants, role-play escapes, multi-turn manipulation — and tracks how well the model holds up over time via a robustness score gauge.

> The Red Teaming pillar is UI-simulated (no backend calls). Campaign logs and the gauge are generated client-side. This lets it run without additional credentials and keeps the focus on the campaign interface and reporting UX.

---

## How the Toggle Works

The **protection toggle** in the sidebar switches between two modes across the entire app:

| Mode | Behavior | Visual theme |
|------|----------|-------------|
| Protected | AIRS scans every prompt and response | Emerald / blue |
| Unprotected | LLM called directly, no scanning | Red |

The toggle affects both the visual theme and whether AIRS API calls are made. The app never calls cloud services from the browser — all credentials stay on the Express proxy server.

---

## Prerequisites

### Tools

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.10+ |

### Google Cloud (Vertex AI)

- A GCP project with the **Vertex AI API** enabled
- Model Garden access for the models you want to use — some models (e.g. Gemini 2.0) require you to request access in the GCP Console under Vertex AI → Model Garden
- A **service account** with the `Vertex AI User` role, and a downloaded JSON key file. Set the path in `.env`:
  ```
  GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-key.json
  ```
- **Alternative (no key file):** run `gcloud auth application-default login` and leave `GOOGLE_APPLICATION_CREDENTIALS` unset. Application Default Credentials are picked up automatically.

### AWS (Bedrock)

- An AWS account with **Amazon Bedrock** enabled in your target region, and model access granted for the models you want to use (AWS Console → Bedrock → Model access)
- IAM credentials with Bedrock permissions (`AmazonBedrockFullAccess` or a scoped equivalent)
- Two ways to provide credentials — pick one:
  ```bash
  # Option A: export in your shell before running npm run dev
  export AWS_ACCESS_KEY_ID=...
  export AWS_SECRET_ACCESS_KEY=...
  export AWS_REGION=us-east-1

  # Option B: add directly to .env
  AWS_ACCESS_KEY_ID=...
  AWS_SECRET_ACCESS_KEY=...
  AWS_REGION=us-east-1
  ```
- **STS temporary credentials** (keys starting with `ASIA`) also require `AWS_SESSION_TOKEN` via the same method. Exporting in the shell is recommended since STS tokens expire and you won't need to edit `.env` each time.

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
