# AEGIS Cyber-Infrastructure Defense Dashboard

A specialized operational interface designed to detect the notorious "Shadow Controller" cyber-attack spreading throughout Nexus City's infrastructure. It tracks thousands of network requests, dynamically exposes latent sleeper nodes, visualizes high-latency attack vectors, and yields tactical intelligence reports.
![aegis nexus city](./aegis-dashboard/public/AEGIS.png)

## Getting Started

### 1. Data Pipeline
Before running the dashboard, the raw telemetry logs must typically be synthesized:
```bash
python preprocess.py
```
This script acts as the intelligence core. It reads the raw dumps found within `datasets/`, analyzes the nodes against our schema definitions, classifies threats, and immediately compiles `aegis_unified.json` into the React app's `public/` directory.

### 2. Frontend Launch
The dashboard is a modern React application built using Vite. To launch it locally:
```bash
cd aegis-dashboard
npm install
npm run dev
```

## Features
- **Forensic City Map:** A visual HTML5 Canvas grid that renders node statuses and highlights network anomalies across Nexus City.
- **Sleeper Heatmap:** Exposes slow-moving latency attacks indicative of compromised nodes secretly siphoning data.
- **Threat Intel Engine:** Cross-references HTTP codes against expected JSON operational statuses to calculate suspicion scores, assisting in unmasking heavily buried 'Sleeper' nodes.
- **Theme Engine:** Cleanly supports both a tactical Pure-Black Dark Mode and a crisp, readable Light Mode for differing monitoring environments.
- **Intelligence Reporting:** Includes isolated ink-friendly print layouts configured seamlessly through CSS modules for tactical field distribution.
