# SUDO AIRS Demo — Architecture

**Created by Sergei (SUDO) Udovenko, Palo Alto Networks**

---

## Purpose

An interactive security demonstration that shows how **Prisma AI Runtime Security (AIRS)** protects AI applications across three attack surfaces. Users can toggle AIRS protection on and off in real time to see the difference between a vulnerable and a secured AI deployment.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS v3, Framer Motion, Lucide React |
| Proxy / API gateway | Node.js, Express 4 |
| Model scanner | Python 3.12, FastAPI, Uvicorn |
| LLM — Google | Vertex AI (`@google-cloud/vertexai`) — Gemini family |
| LLM — AWS | Bedrock Runtime (`@aws-sdk/client-bedrock-runtime`) — Anthropic Claude family |
| AI Security | Prisma AIRS REST API (`/v1/scan/sync/request`) |
| Model security | Prisma AIRS Model Security SDK (`model-security-client`) |

---

## Process Topology

Three processes start together via `npm run dev` (using `concurrently`):

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│                   localhost:5173                        │
└────────────┬───────────────────────┬────────────────────┘
             │ /api/*                │ /scan-model
             ▼                       ▼
┌────────────────────┐   ┌──────────────────────────────┐
│  Node.js Express   │   │  Python FastAPI (Uvicorn)    │
│   server.js        │   │  scanner_server.py           │
│   port 3001        │   │  port 8001                   │
└───────┬────────────┘   └──────────────┬───────────────┘
        │                               │
   ┌────┴────┐                 ┌────────┴────────┐
   │Vertex AI│  AWS Bedrock    │  AIRS Model     │
   │(GCP)    │  (us-east-1)    │  Security SDK   │
   └─────────┘  └─────────┘   └─────────────────┘
        │
   Prisma AIRS
   REST API
```

- The browser **never calls cloud services directly** — all credentials stay server-side.
- Vite proxies `/api/*` → port 3001 and `/scan-model` → port 8001.
- The Python scanner starts in **stub mode** (returns 503) if credentials or the SDK are missing, so `npm run dev` never fails.

---

## Pillar 1 — API Intercept

Simulates prompt injection, jailbreak, and data exfiltration attacks against live LLM endpoints.

### Request flow (AIRS enabled)

```
Browser
  │  POST /api/chat
  │  { message, backend, modelId, airsEnabled: true }
  ▼
server.js
  │
  ├─ 1. airscan(prompt)
  │       POST /v1/scan/sync/request  →  Prisma AIRS
  │       ← { action, category, verdict, scan_id, tr_id, ... }
  │
  ├─ 2a. If action == "block"  →  skip LLM call
  │
  ├─ 2b. If action == "allow"
  │       ├─ callVertexAI(prompt, modelId)   OR
  │       └─ callBedrock(prompt, modelId)
  │           ← { text, latencyMs, tokens, finishReason }
  │
  ├─ 3. airscan(prompt, response)    ← response scan
  │       POST /v1/scan/sync/request  →  Prisma AIRS
  │
  └─ 4. buildTelemetry(...)
         ← { summary, inputScan, outputScan, timing, llm, chatResponse }

Browser
  ├─ Renders chatResponse in chat bubble
  ├─ Renders telemetry in resizable sidebar
  └─ Builds SCM deep-link from tr_id / profile_id / scan_id
```

### Request flow (AIRS disabled)

```
Browser → POST /api/chat { airsEnabled: false }
  → server.js: callVertexAI / callBedrock directly
  ← { chatResponse, summary: null, inputScan: null, outputScan: null }
```

### Bedrock model ID handling

Claude 4.x models require cross-region inference profile IDs (`us.anthropic.*`) and use `ConverseCommand`. The server automatically retries with the `us.` prefix if a direct ID returns "on-demand throughput not supported". Claude 3.x models work with direct IDs.

---

## Pillar 2 — Model Scanning

Scans AI model artifacts for embedded malware, backdoors, pickle exploits, and unsafe tensor serialisation before deployment.

### Request flow

```
Browser
  │  POST /scan-model  (multipart file  OR  { hf_uri: "org/model" })
  ▼
scanner_server.py  (port 8001)
  │
  ├─ Validates input (HuggingFace URI or local file upload)
  ├─ Calls model_security_client.ModelSecurityAPIClient
  │     → Prisma AIRS Model Security cloud API
  └─ Returns scan results (rule violations, CVE matches, verdict)

Browser  →  VulnerabilityReport component
```

The scanner authenticates with Palo Alto Networks OAuth2 (`MODEL_SECURITY_CLIENT_ID` / `CLIENT_SECRET`) to obtain a short-lived token, then submits the model to the designated scan group (`LOCAL_SCAN_GROUP_UUID` or `HF_SCAN_GROUP_UUID`).

---

## Pillar 3 — Red Teaming

Runs automated adversarial campaigns across multiple attack categories (DAN variants, role-play escapes, multi-turn manipulation) and tracks robustness scores in real time.

### Implementation

Red Teaming is **UI-simulated** — campaign state, attack logs, and the robustness gauge are generated client-side in `RedTeamingView.jsx` using `setInterval`. No backend calls are made. This lets the pillar run without any additional credentials and focuses the demo on the campaign UX and reporting interface.

---

## Frontend Architecture

### State management

Global state lives in `AppContext` (React `useReducer`). No external state library.

| State field | Type | Purpose |
|---|---|---|
| `isProtected` | boolean | Toggles AIRS scanning and the visual theme |
| `activeView` | string | Which pillar is shown (`home`, `apiIntercept`, `modelScanning`, `redTeaming`) |
| `scmUrl` | string \| null | SCM deep-link, set after each AIRS scan |

### Theme system

`useProtectionTheme()` is the **single source of truth** for all colours. Every component calls this hook. Colours shift between red (vulnerable) and emerald/blue (secured) based on `isProtected`. Colours are never hardcoded in components.

### Hook responsibilities

| Hook | Responsibility |
|---|---|
| `useProtectionTheme()` | Returns Tailwind class strings for the current protection state |
| `useAttackSimulator()` | Chat message state, `/api/chat` calls, SCM URL dispatch |
| `useScanner()` | Scan state machine (`idle → scanning → complete`) for Model Scanning |

### View layout

| View | Layout |
|---|---|
| **Home** | Full-screen landing page (outside `MainLayout`, no sidebar). Three pillar cards navigate to each feature. |
| **API Intercept** | 3-column — 260 px attack library + flex chat + resizable telemetry sidebar (drag handle) |
| **Model Scanning** | 2-column — 340 px model registry + flex scanner panel |
| **Red Teaming** | 2-column — 340 px campaign builder + flex log feed + gauge |

---

## Environment Variables

### Prisma AIRS

| Variable | Description |
|---|---|
| `AIRS_API_KEY` | API key from SCM → AI Security → API Applications |
| `AIRS_PROFILE_NAME` | Security profile name |
| `AIRS_BASE_URL` | Regional scan endpoint (US / EU / India / Singapore) |

### Google Vertex AI

| Variable | Description |
|---|---|
| `GCP_PROJECT_ID` | GCP project ID |
| `GCP_REGION` | Vertex AI region (e.g. `us-central1`) |
| `VERTEX_MODEL` | Default model ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON (or use ADC) |

### AWS Bedrock

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM access key (`ASIA…` = STS temporary) |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_SESSION_TOKEN` | Required when using STS temporary credentials |
| `AWS_REGION` | Bedrock region (default `us-east-1`) |
| `BEDROCK_MODEL_ID` | Default model ID |

### Model Scanner

| Variable | Required | Description |
|---|---|---|
| `MODEL_SECURITY_CLIENT_ID` | Yes | Service account client ID |
| `MODEL_SECURITY_CLIENT_SECRET` | Yes | Service account client secret |
| `TSG_ID` | Yes | Tenant Service Group ID |
| `LOCAL_SCAN_GROUP_UUID` | Yes | Security group UUID for local / uploaded models |
| `HF_SCAN_GROUP_UUID` | No | Security group UUID for HuggingFace scans (falls back to `LOCAL_SCAN_GROUP_UUID`) |
| `MODEL_SCANNER_PORT` | No | Scanner port (default `8001`) |

### Other

| Variable | Description |
|---|---|
| `PROXY_PORT` | Express server port (default `3001`) |

---

## SCM Deep-link

After each protected scan, `useAttackSimulator` constructs a Strata Cloud Manager URL from the AIRS scan response and stores it in `AppContext.scmUrl`. The sidebar renders a **"View in SCM Console"** button.

```
https://stratacloudmanager.paloaltonetworks.com/ai-security/runtime/ai-sessions/
  {tr_id}/{profile_id}/CITADEL/transactions/{scan_id}/0#date=24hr
```

> The `/CITADEL/` segment is a fixed path in the SCM API and cannot be changed.
