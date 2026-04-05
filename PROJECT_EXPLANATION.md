# Architecture & Project Explanation

## The Threat Landscape

Nexus City's critical infrastructure is under siege by a stealth infiltration designated the "Shadow Controller." This adversary employs a dual-layer deception strategy:

1. **JSON Status Masking** -- Compromised nodes report `OPERATIONAL` via JSON payload while their HTTP status codes reveal the truth (206 Partial Content, 429 Too Many Requests).
2. **Base64 Hardware Obfuscation** -- All node serial numbers are embedded as Base64-encoded strings within User-Agent headers, making manual asset identification impractical.
3. **Schema Key Rotation** -- At log entry 5000, the active telemetry column rotates from `load_val` to `L_V1`. Parsers unaware of this rotation silently misread 50% of all data.

Traditional perimeter defenses see `200 OK` and move on. AEGIS is built to look deeper.

---

## System Architecture

AEGIS implements a three-stage pipeline: **offline data preprocessing**, **ML-driven threat scoring**, and a **real-time React dashboard** for operational visibility.

```
datasets/                 preprocess.py           threat_engine.py
  node_registry.csv   -->   Correlate, decode,  -->   Train Random Forest
  system_logs.csv          classify, score            on NSL-KDD dataset
  schema_config.csv         |                          |
                            v                          v
                     aegis_unified.json         threat_weights.json
                            |                          |
                            +-------- Dashboard -------+
                                   (React + Vite)
```

### Stage 1: Data Preprocessing (`preprocess.py`)

A Python pipeline that transforms raw CSV telemetry into a single unified JSON consumed by the dashboard.

1. **Dataset Loading** -- Reads three CSV files from `datasets/`:
   - `node_registry.csv` (500 nodes with User-Agent strings, infection flags)
   - `system_logs.csv` (10,000 log entries with HTTP codes, response times, load values)
   - `schema_config.csv` (schema rotation timeline with version, time_start, active_column)

2. **Base64 Serial Decoding** -- Extracts the encoded segment from each node's User-Agent string (`AEGIS-Node/X.X (Linux) <BASE64>`) and decodes it to reveal the true hardware serial number (format `SN-XXXX`). Invalid decodes are flagged.

3. **Schema Rotation Resolution** -- For each log entry, determines which schema version was active at that point in time and reads the correct data column. Entries parsed against the wrong column are flagged as schema parse failures.

4. **Mismatch Detection** -- Identifies entries where `json_status == "OPERATIONAL"` but `http_response_code != 200` -- the core deception signal.

5. **Threat Classification** -- Each log entry receives a classification (`CLEAN`, `SUSPICIOUS`, `COMPROMISED`) based on five weighted signals:
   - Non-200 HTTP code
   - Response time > 2000ms
   - Node infection flag from registry
   - Invalid/unknown serial number
   - Schema parse failure

6. **Suspect Scoring** -- Each node receives a 0-100 composite score:
   | Factor | Max Weight | Logic |
   |---|---|---|
   | HTTP vs JSON Mismatch | 30 pts | Ratio of mismatched entries scaled x5 |
   | Response Time Outlier | 25 pts | Linear scale above 200ms baseline |
   | Unknown Serial | 25 pts | Full points if serial doesn't match `SN-XXXX` |
   | Schema Parse Failures | 20 pts | Ratio of failures scaled x5 |

7. **Output** -- Writes `aegis_unified.json` to `aegis-dashboard/public/` containing:
   - `summary`: aggregate stats, top 5 suspects
   - `nodes`: 500 enriched node records with coordinates, alerts, scores
   - `logs`: 10,000 processed log entries
   - `heatmap`: response time averages per node per 500-entry window
   - `schema_timeline`: rotation history

### Stage 2: ML Threat Engine (`threat_engine.py`)

A Random Forest classifier trained on the real **NSL-KDD 2009** network intrusion dataset (125,973 training records). Three NSL-KDD features are mapped to dashboard-interpretable signals:

| NSL-KDD Feature | Dashboard Signal | Mapping Logic |
|---|---|---|
| `duration` | `latency_jitter` | Connection duration (0-60s) scaled to 0-500ms |
| `flag` | `http_risk` | Connection flags mapped to 4-tier risk (0=SF/safe, 3=S0/critical) |
| `count` | `request_freq` | Connections to same host in 2s window, clipped 0-120 |

**Model**: Random Forest with 200 trees, max depth 10, balanced class weights.
**Accuracy**: 70.81% on the NSL-KDD test set.

Feature importances (what drives threat detection):
- `http_risk`: 58.95% -- connection status is the strongest signal
- `request_freq`: 38.88% -- traffic volume is the second driver
- `latency_jitter`: 2.17% -- timing anomalies contribute marginally

The engine derives JS-ready scoring thresholds by sweeping each feature and finding the probability crossover points, then exports everything to `threat_weights.json`. These weights power the dashboard's autonomous response system with data-driven thresholds rather than hardcoded values.

### Stage 3: The Dashboard (`aegis-dashboard/`)

A single-page application built with **React 19**, **Vite 8**, and **React Router 7**. Zero external UI libraries -- all visualizations use native Canvas/SVG and vanilla CSS.

---

## Dashboard Architecture

### Application Shell

- **DataContext** (`context/DataContext.jsx`) -- Global provider that fetches `aegis_unified.json` once and distributes it to all pages via React Context.
- **Layout** (`components/Layout.jsx`) -- Persistent shell with:
  - **Top Status Bar**: Live metrics (node count, threats, schema version, rotation countdown timer, uptime counter)
  - **Alert Banner**: Pulsing threat advisory when compromised nodes exist
  - **Collapsible Sidebar**: 7-item navigation with keyboard shortcut hints, live node health stats in footer
  - **Theme Toggle**: Full dark/light mode via CSS custom properties on `:root`

### Seven Dashboard Views

#### 1. Dashboard (`/`)
The command center overview with three panels:
- **Forensic City Map** -- Custom HTML5 Canvas rendering of all 500 nodes on a grid. Color-coded by true HTTP status (Green=2xx, Yellow=3xx-4xx, Red=5xx/Infected, Purple=Deception). Includes a "Mask View" toggle that shows what the attacker wants you to see (all cyan/operational) versus the real threat landscape. Hover tooltips reveal node ID, decoded serial, status, infection flag, and suspect score. Canvas redraws on window resize and theme change.
- **Shadow Controller Suspects** -- Top 4 suspect nodes with scores and mismatch counts.
- **System Alerts** -- Live alert feed of hijack-detected nodes (infected + mismatched).

#### 2. Autonomous Response (`/response`)
A real-time threat simulation powered by the ML-derived weights from `threat_weights.json`:
- **DEFCON Status Bar** -- 5-level threat scale (NOMINAL to CRITICAL) computed from quarantine count and average threat score.
- **Network Topology Map** -- SVG ring topology of 8 simulated nodes connected via animated data-flow lines. Node colors, connection states, and pulse animations all respond to live threat levels. Click a node to inject an attack vector.
- **Node Health Monitor** -- 8 cards each showing a circular SVG threat gauge (0-100), sparkline history, and three signal readings (jitter, HTTP risk, req/s). Cards pulse on warning/quarantine status changes.
- **Quarantine Threshold Slider** -- Adjustable 20-95 sensitivity control. Nodes exceeding the threshold are automatically isolated.
- **Attack Timeline** -- Scrolling event feed with severity-colored entries (SYSTEM, WARNING, QUARANTINE, ATTACK).
- **Quarantine Log** -- Detailed isolation records with trigger signals and scores.
- **ML Model Info Panel** -- Live display of model accuracy, feature importance bars, and training data provenance.
- **Export** -- Generates a structured JSON incident report with full grid status, node details, quarantine log, and recent events.

#### 3. Node Explorer (`/nodes`)
Full **Asset Registry** table for all 500 nodes:
- Columns: Node ID, Masked ID (truncated Base64), Decoded Serial, Status (badge), Flag (Suspect/Watch/Clear with score), Mismatches
- Sortable by any column (ascending/descending toggle)
- Searchable with real-time filtering by node ID, serial number, or status
- Paginated at 20 rows per page with navigation controls
- Unknown serials highlighted in purple with `[UNKNOWN]` tag

#### 4. Sleeper Heatmap (`/heatmap`)
Visual matrix of API response times per node over time windows:
- X-axis: Time windows (log_id divided into 500-entry buckets)
- Y-axis: Node IDs
- Color intensity maps to response time in milliseconds (hotter = slower = more suspicious)
- Nodes exceeding 2000ms threshold are categorized as "Sleeper Suspects"

#### 5. Threat Intel (`/threats`)
Dedicated intelligence analysis view:
- **Shadow Controller Candidates** -- Card layout for top 5 suspects showing masked hash, decoded serial, average response time, mismatch count, and alert tags (HIJACK DETECTED, COMPROMISED NODE, UNKNOWN NODE, SCHEMA BREACH).
- **Active Incident Stream** -- Live feed of all hijack events with contextual details about the deception (Operational JSON vs actual HTTP 206 frames).

#### 6. Schema Monitor (`/schema`)
Terminal-style live log replay simulating the schema rotation event stream:
- Auto-advancing feed showing log entries with timestamp, schema version, active column, and parsed values
- Color-coded: grey for normal, red for parse errors and mismatches, green for rotation events
- Highlights the critical rotation at log_id 5000 where `load_val` switches to `L_V1`
- Pause/Resume and Clear controls
- Smart auto-scroll that only follows new entries when the user is near the bottom

#### 7. Intelligence Report (`/report`)
Auto-generated classified-style terminal report:
- Summary statistics, deception layer analysis, Base64 masking observations, schema vulnerability details
- Top 5 suspects with node IDs, serials, and threat scores
- Operational recommendations
- Print-ready via browser print dialog with dedicated `@media print` styles

### Shared Components

| Component | Purpose |
|---|---|
| `Panel` | Reusable bordered container with title, icon, optional controls, and footer |
| `CityMap` | Imperative Canvas renderer bypassing React DOM for 60fps tracking of 500+ animated nodes |
| `Heatmap` | Response time visualization matrix |
| `TopologyMap` | SVG network topology with animated data-flow lines and interactive nodes |
| `NodeHealthCard` | Per-node status card with circular SVG gauge, sparkline chart, and signal readouts |

### Frontend Threat Engine (`engine/ThreatEngine.js`)

JavaScript module that mirrors the ML model's scoring logic for real-time autonomous simulation:
- `calcThreatScore()` -- Computes 0-100 score from jitter, HTTP risk, and request frequency using the ML-derived max contribution weights
- `createSimNode()` / `generateAttackVector()` -- Node initialization and attack injection for the simulation
- `calcDefcon()` -- Maps grid state to a 5-level DEFCON scale
- `exportReport()` -- Generates downloadable JSON incident reports
- Color utility functions for consistent threat-level visualization

---

## Tech Stack

| Layer | Technology |
|---|---|
| Preprocessing | Python 3 (csv, base64, json, re, collections) |
| ML Engine | scikit-learn (Random Forest), pandas, numpy, joblib |
| Training Data | NSL-KDD 2009 network intrusion dataset (125,973 records) |
| Frontend Framework | React 19 + React Router 7 |
| Build Tool | Vite 8 |
| Visualization | Native HTML5 Canvas, inline SVG |
| Styling | Vanilla CSS with `:root` custom properties, CSS variables for theming |
| Typography | JetBrains Mono (data/monospace), Bebas Neue (headers/display) |
| External Libraries | None beyond React ecosystem -- no D3, no Chart.js, no Tailwind |

---

## Design Philosophy

**Theme**: Dark military-cyber terminal aesthetic -- classified ops center, not startup dashboard.

- Background: Deep navy/near-black (`#0a0e1a`)
- Accent palette: Toxic green (`#00ff88`) for safe, amber (`#f78b04`) for warnings, red (`#ff2d55`) for threats, purple (`#8b5cf6`) for deception
- Scanline overlay for CRT atmosphere
- Animated threat pulses on compromised nodes
- Glassmorphism-style panels with subtle borders and backdrop effects
- Full light/dark theme switching via CSS custom properties (no JS reloads)
- `@media print` stylesheet for clean intelligence report output

---

## Datasets

| File | Records | Description |
|---|---|---|
| `datasets/node_registry.csv` | 500 | Node UUIDs, User-Agent strings with Base64 serials, infection flags |
| `datasets/system_logs.csv` | 10,000 | Log entries with HTTP codes, JSON statuses, response times, dual load columns |
| `datasets/schema_config.csv` | 2 | Schema rotation timeline (version 1 at time 0, version 2 at time 5000) |

---

## Key Outputs

| File | Purpose |
|---|---|
| `aegis-dashboard/public/aegis_unified.json` | Preprocessed dataset consumed by the React dashboard |
| `threat_weights.json` | ML-derived scoring thresholds and feature importances for the frontend engine |
| `threat_model.pkl` | Serialized Random Forest model (200 trees) |
| `shadow_controller_report.md` | Static intelligence report identifying top suspects and attack patterns |

---

## Moving Forward

The current architecture delivers a complete pipeline from raw telemetry to interactive threat visualization. Future development paths:

1. **Real-Time Streaming** -- Replace the static JSON pipeline with WebSocket-based live data ingestion, enabling the dashboard to process and display threat signals as they arrive.
2. **Model Iteration** -- Expand beyond the three-feature Random Forest to deeper architectures incorporating temporal patterns, graph-based anomaly detection, and adversarial robustness testing.
3. **Automated Containment** -- Extend the autonomous response simulation into an actionable containment system with real network integration (firewall rule injection, subnet isolation).
4. **Historical Analysis** -- Add time-series storage and replay capabilities so operators can investigate past incidents with full context.

---

*"The Shadow Controller hides in the gap between what the system reports and what it actually does."*
