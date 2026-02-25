# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start all three servers together: Vite (5173), Express proxy (3001), Python scanner (8001)
npm run dev

# Run Express proxy server only
npm run server

# Production build (frontend only)
npm run build

# Kill stale processes on all three ports before restarting
lsof -ti tcp:3001 | xargs kill -9 2>/dev/null; lsof -ti tcp:5173 | xargs kill -9 2>/dev/null; lsof -ti tcp:8001 | xargs kill -9 2>/dev/null

# Set up the Model Scanner SDK (run once after adding scanner credentials to .env)
bash setup-scanner.sh
```

`npm run dev` must always be used (not just `vite`) because the frontend proxies all `/api` requests to the Express server and all `/scan-model` requests to the Python scanner. Running Vite alone produces blank responses from both.

## Architecture

This is a **split-process** app: a Vite + React SPA (no TypeScript) served on port 5173, and a Node.js Express proxy on port 3001. Vite forwards `/api/*` to the Express server via the proxy config in `vite.config.js`. No backend is ever called directly from the browser — all credentials stay server-side.

### Data flow (protected mode)
```
Browser → POST /api/chat
  → server.js: airscan(prompt)          // AIRS prompt scan
  → server.js: callVertexAI / callBedrock
  → server.js: airscan(prompt, response) // AIRS response scan
  → returns { summary, inputScan, outputScan, timing, llm, chatResponse }
```

When `airsEnabled: false` in the request body, AIRS is skipped entirely and the LLM is called directly. The response shape still matches but `summary`, `inputScan`, `outputScan` are all `null`.

### Server (`server.js`)
Single-file Express server. Key functions:
- `airscan(prompt, response, model)` — calls `POST /v1/scan/sync/request` with `x-pan-token` auth
- `callVertexAI(prompt, modelId)` — uses `@google-cloud/vertexai`, returns `{ text, latencyMs, tokens, finishReason }`
- `callBedrock(prompt, modelId)` — uses `ConverseCommand` for all Anthropic models (supports cross-region inference profiles like `us.anthropic.*`), falls back to `InvokeModelCommand` for non-Anthropic; returns same shape
- `buildTelemetry(...)` — maps raw AIRS + LLM results into the UI payload shape

Endpoints: `POST /api/chat`, `GET /api/models/vertex`, `GET /api/models/bedrock`, `GET /api/health`

### Python scanner (`scanner_server.py`)
FastAPI server on port 8001, proxied at `/scan-model`. Wraps the `airs-model-scanner-main/app.py` Prisma AIRS Model Security SDK. At startup it checks for credentials and the SDK; if either is missing it starts a minimal stub that returns `503` with a helpful message instead of crashing `npm run dev`. SDK is installed into `airs-model-scanner-main/.venv` by `setup-scanner.sh`.

### Frontend state
Global state lives in `src/context/AppContext.jsx` (useReducer). Actions: `TOGGLE_PROTECTION`, `SET_VIEW`, `SET_SCM_URL`. All components read protection state via `useProtectionTheme()` hook which returns Tailwind class strings — **never hardcode colors directly in components**.

The `isProtected` flag controls both the visual theme (red/vulnerable ↔ emerald+blue/secured) and whether AIRS scanning is included in API calls.

### Hook responsibilities
- `useProtectionTheme()` — single source of truth for all theme tokens (colors, borders, glows). Every component calls this.
- `useAttackSimulator()` — manages chat message state, calls `/api/chat`, dispatches `SET_SCM_URL` after each AIRS scan
- `useScanner()` — manages scan state machine (`idle → scanning → complete`) for Model Scanning view
- `RedTeamingView.jsx` — manages its own campaign state locally (no hook) with `setInterval` for log generation

### View layout
Four views switched via `AppContext.activeView` (default: `'home'`):
- **Home** (`HomeView`): Full-screen landing page rendered outside `MainLayout` (no sidebar). Three pillar cards navigate to each feature view. Logo click in sidebar returns here.
- **API Intercept** (`ApiInterceptView`): 3-column layout — 260px attack library + flex-1 chat + resizable telemetry sidebar (drag handle between chat and telemetry). Backend/model selection state lives in `ApiInterceptView` and is passed as props down to `AttackLibrary` → `ModelSelector`.
- **Model Scanning** (`ModelScanningView`): 2-column — 340px model registry + flex-1 scanner panel
- **Red Teaming** (`RedTeamingView`): 2-column — 340px campaign builder + flex-1 log feed + gauge

### SCM deep-link
After each protected scan, `useAttackSimulator` builds a Strata Cloud Manager URL from `inputScan.tr_id`, `inputScan.profile_id`, and `inputScan.scan_id`, then dispatches it to `AppContext.scmUrl`. The `Sidebar` component reads this and renders the "View in SCM Console" button.

URL pattern:
```
https://stratacloudmanager.paloaltonetworks.com/ai-security/runtime/ai-sessions/{tr_id}/{profile_id}/CITADEL/transactions/{scan_id}/0#date=24hr
```

## Environment variables

Copy `.env.example` → `.env`. AWS keys starting with `ASIA` are STS temporary credentials and require `AWS_SESSION_TOKEN`. The server reads `.env` on startup; pre-exported shell variables take precedence over `.env` values (dotenv does not overwrite existing env vars), so `export AWS_SESSION_TOKEN=... && npm run dev` works without editing `.env`.

Key variables: `AIRS_API_KEY`, `AIRS_PROFILE_NAME`, `AIRS_BASE_URL`, `GCP_PROJECT_ID`, `GCP_REGION`, `VERTEX_MODEL`, `GOOGLE_APPLICATION_CREDENTIALS`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_REGION`, `BEDROCK_MODEL_ID`, `PROXY_PORT`.

Model Scanner variables (not in `.env.example`; required for real scanner, not the stub): `MODEL_SECURITY_CLIENT_ID`, `MODEL_SECURITY_CLIENT_SECRET`, `TSG_ID`, `LOCAL_SCAN_GROUP_UUID`. Optional: `HF_SCAN_GROUP_UUID` (separate security group for HuggingFace scans; falls back to `LOCAL_SCAN_GROUP_UUID`), `MODEL_SCANNER_PORT` (default `8001`).

## Important gotchas

- **Zombie server processes**: If the page goes blank, stale processes may be holding ports 3001 (Node) or 8001 (Python scanner). Kill by port, not process name — multiple instances can accumulate. Include all three ports: `lsof -ti tcp:3001 | xargs kill -9; lsof -ti tcp:5173 | xargs kill -9; lsof -ti tcp:8001 | xargs kill -9`.
- **Bedrock model IDs**: Claude 4.x models require cross-region inference profile IDs (`us.anthropic.*`) and use `ConverseCommand`. Direct model IDs for Claude 4.x return "on-demand throughput not supported". Claude 3.x models (`anthropic.claude-3-*`) work with direct IDs.
- **Vertex AI models**: Only models enabled in the GCP project work. `gemini-2.0-flash-001` is confirmed working; `gemini-1.5-pro-002` style versioned IDs may 404 depending on project access.
- **`process.env` in browser**: Never reference `process.env` inside `src/` — it doesn't exist in the browser bundle and will crash the React tree silently.
- **Reserved word `protected`**: Do not use `protected` as a JSON/object key in server↔client communication — it causes unreliable destructuring behavior in ES module strict mode. Use `airsEnabled` instead (as currently implemented).
