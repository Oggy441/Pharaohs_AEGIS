# AEGIS — Cyber-Infrastructure Defense Dashboard

> **Nexus City Hackathon** · Round 1: Shadow Controller Detection · Round 2: Autonomous Incident Response

![AEGIS](./aegis-dashboard/public/AEGIS.png)

---

## Mission

AEGIS is a full-spectrum cyber defense platform for Nexus City's infrastructure. It combines **forensic threat detection** (Round 1) with **ML-powered autonomous incident response** (Round 2) to detect, evaluate, and quarantine compromised nodes in real-time.

---

## Round 1 — Shadow Controller Detection

The forensic analysis dashboard exposes the "Shadow Controller" hiding behind deceptive telemetry:

| Panel | What It Does |
|---|---|
| **Forensic City Map** | HTML5 Canvas grid with true HTTP-based node coloring vs deceptive JSON mask |
| **Sleeper Heatmap** | Response time visualization exposing slow-moving latency attacks |
| **Schema Monitor** | Live log feed tracking schema key rotation (every 10 min) |
| **Asset Registry** | Sortable/searchable table with Base64-decoded hardware serial numbers |
| **Threat Intel** | Shadow Controller candidates ranked by suspect score |
| **Intelligence Report** | Printable tactical report |

**Key Insight**: All 70 infected nodes (14%) report `OPERATIONAL` JSON status while exhibiting anomalous HTTP codes (206, 429) — the deception layer.

---

## Round 2 — Autonomous Incident Response

A **self-governing defense mechanism** powered by machine learning:

### ML Threat Score Engine
- **Data**: NSL-KDD 2009 dataset (125,973 real network intrusion records)
- **Model**: Random Forest (200 trees, depth 10) — **70.81% accuracy**
- **Key ML Insight**: Connection quality flags (`http_risk`) are **27x** more important than latency for detecting attacks
- Feature importances: http_risk=58.95%, request_freq=38.88%, latency_jitter=2.17%

### Dashboard Deliverables (all in "Auto Response" page)
| Deliverable | Description |
|---|---|
| **Attack Timeline** | Real-time event stream with severity-coded entries |
| **Quarantine Log** | Detailed isolation records with trigger signals |
| **Node Health Monitor** | 8 nodes with circular threat gauges, sparklines, live signals |
| **Response Simulator** | Adjustable quarantine threshold + manual attack injection |
| **Network Topology** | SVG octagonal grid with animated data flow |
| **ML Model Info** | Feature importances visualization + accuracy badge |
| **DEFCON Status** | Grid-wide threat level (1-5) |
| **Incident Export** | One-click JSON report download |

---

## How to Run

### 1. Data Pipeline (if regenerating data)
```bash
python preprocess.py
```

### 2. ML Engine (if retraining model)
```bash
pip install numpy pandas scikit-learn joblib
python threat_engine.py
```

### 3. Dashboard
```bash
cd aegis-dashboard
npm install
npm run dev
```
Open `http://localhost:5173` → Navigate to **"Auto Response"** in the sidebar for Round 2 features.

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML Engine | Python · scikit-learn · Random Forest · NSL-KDD |
| Data Pipeline | Python · CSV · Base64 · JSON |
| Dashboard | React 19 · Vite 8 · react-router-dom |
| Visualization | HTML5 Canvas (City Map) · SVG (Topology) · CSS Animations |
| Design | JetBrains Mono · Bebas Neue · Dark Terminal Theme |

---

## Project Structure

```
Pharaohs_AEGIS/
├── datasets/                    # Raw telemetry data
│   ├── node_registry.csv        # 500 nodes with encoded serials
│   ├── system_logs.csv          # 10,000 log entries
│   └── schema_config.csv        # Schema rotation config
├── preprocess.py                # Data pipeline → aegis_unified.json
├── threat_engine.py             # ML training on NSL-KDD
├── threat_weights.json          # ML-derived scoring weights
├── shadow_controller_report.md  # Round 1 intelligence report
├── aegis-dashboard/
│   ├── public/
│   │   └── aegis_unified.json   # Preprocessed data (3.8MB)
│   └── src/
│       ├── engine/
│       │   └── ThreatEngine.js       # ML scoring (Round 2)
│       ├── components/
│       │   ├── CityMap.jsx           # Canvas city map (R1)
│       │   ├── Heatmap.jsx           # Sleeper heatmap (R1)
│       │   ├── Layout.jsx            # Sidebar + header
│       │   ├── Panel.jsx             # Reusable panel
│       │   ├── NodeHealthCard.jsx    # Node gauge card (R2)
│       │   └── TopologyMap.jsx       # SVG topology (R2)
│       ├── pages/
│       │   ├── Dashboard.jsx         # City map + suspects (R1)
│       │   ├── NodeExplorer.jsx      # Asset registry (R1)
│       │   ├── SleeperHeatmapPage.jsx # Heatmap page (R1)
│       │   ├── ThreatIntel.jsx       # Threat analysis (R1)
│       │   ├── SchemaMonitor.jsx     # Schema feed (R1)
│       │   ├── Report.jsx            # Intel report (R1)
│       │   └── AutonomousResponse.jsx # Auto response (R2)
│       └── context/
│           └── DataContext.jsx       # Data provider
└── README.md
```

---

## Team

- **Team Name**: Pharaohs
- **Members**: _Ritvik Singh_ [Team Leader], _Aaditya Gupta_, _Neeraj_, _Mohammad Rehan Ansari_

---

*"The Shadow Controller hides in the gap between what the system reports and what it actually does."*
