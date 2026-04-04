/**
 * AEGIS Autonomous Response — ML-Derived Threat Score Engine
 * ==========================================================
 * Weights from Random Forest trained on 125,973 NSL-KDD records (70.81% accuracy)
 * Feature importances: http_risk=58.95%, request_freq=38.88%, latency_jitter=2.17%
 *
 * Integrates with the existing AEGIS suspect_score system from Round 1.
 */

export const ML_WEIGHTS = {
  source: 'NSL-KDD 2009 — real network intrusion dataset',
  model: 'Random Forest (200 trees, depth 10)',
  accuracy: 70.81,
  trainRecords: 125973,
  featureImportances: {
    latency_jitter: 0.0217,
    http_risk: 0.5895,
    request_freq: 0.3888,
  },
  maxContribution: {
    latency_jitter: 3,
    http_risk: 59,
    request_freq: 39,
  },
  thresholds: {
    latency_jitter: { safe: 100, warning: 300 },
    http_risk: { safe: 0, low: 1, high: 2, critical: 3 },
    request_freq: { safe: 45, warning: 80 },
  },
  quarantineThreshold: 75,
};

export const HTTP_DISPLAY = { 0: 200, 1: 302, 2: 403, 3: 503 };

export const NODE_NAMES = [
  'ALPHA-7','BETA-12','GAMMA-3','DELTA-9',
  'EPSILON-5','ZETA-1','ETA-8','THETA-4',
];

export function calcThreatScore({ jitter, httpRisk, freq }) {
  const W = ML_WEIGHTS;
  let score = 0;

  if (jitter > W.thresholds.latency_jitter.warning) {
    score += W.maxContribution.latency_jitter;
  } else if (jitter > W.thresholds.latency_jitter.safe) {
    const r = (jitter - W.thresholds.latency_jitter.safe) /
              (W.thresholds.latency_jitter.warning - W.thresholds.latency_jitter.safe);
    score += W.maxContribution.latency_jitter * (0.3 + 0.7 * r);
  }

  const httpTiers = { 0: 0, 1: 0.25, 2: 0.6, 3: 1.0 };
  score += W.maxContribution.http_risk * (httpTiers[httpRisk] || 0);

  if (freq > W.thresholds.request_freq.warning) {
    score += W.maxContribution.request_freq;
  } else if (freq > W.thresholds.request_freq.safe) {
    const r = (freq - W.thresholds.request_freq.safe) /
              (W.thresholds.request_freq.warning - W.thresholds.request_freq.safe);
    score += W.maxContribution.request_freq * (0.4 + 0.6 * r);
  }

  return Math.min(Math.round(score), 100);
}

export function createSimNode(id) {
  return {
    id, name: NODE_NAMES[id], status: 'active',
    score: Math.floor(Math.random() * 12),
    jitter: 20 + Math.random() * 55, httpRisk: 0,
    freq: 8 + Math.random() * 20, uptime: 0,
    scoreHistory: Array(30).fill(Math.floor(Math.random() * 8)),
  };
}

export function generateAttackVector() {
  return {
    jitter: 280 + Math.random() * 180,
    httpRisk: Math.random() > 0.3 ? 3 : 2,
    freq: 82 + Math.random() * 35,
  };
}

export function calcDefcon(quarantined, avgScore) {
  if (quarantined >= 5 || avgScore > 80) return { level: 1, label: 'CRITICAL', cls: 'text-red' };
  if (quarantined >= 3 || avgScore > 65) return { level: 2, label: 'SEVERE', cls: 'text-red' };
  if (quarantined >= 1 || avgScore > 45) return { level: 3, label: 'ELEVATED', cls: 'text-yellow' };
  if (avgScore > 25) return { level: 4, label: 'GUARDED', cls: 'text-blue' };
  return { level: 5, label: 'NOMINAL', cls: 'text-green' };
}

export const scoreColor = s => s >= 75 ? 'var(--red)' : s >= 45 ? 'var(--yellow)' : s >= 20 ? 'var(--blue)' : 'var(--green)';
export const statusColor = s => s === 'quarantined' ? 'var(--red)' : s === 'warning' ? 'var(--yellow)' : 'var(--green)';
export const sevColor = s => s === 'critical' ? 'var(--red)' : s === 'warning' ? 'var(--yellow)' : 'var(--blue)';

export function exportReport(nodes, timeline, qLog, threshold) {
  const report = {
    reportTitle: 'AEGIS Defense Grid — Autonomous Incident Report',
    generatedAt: new Date().toISOString(),
    mlModel: { source: ML_WEIGHTS.source, type: ML_WEIGHTS.model, accuracy: ML_WEIGHTS.accuracy + '%', trainRecords: ML_WEIGHTS.trainRecords },
    gridStatus: {
      totalNodes: nodes.length,
      active: nodes.filter(n => n.status === 'active').length,
      warning: nodes.filter(n => n.status === 'warning').length,
      quarantined: nodes.filter(n => n.status === 'quarantined').length,
      avgThreatScore: Math.round(nodes.reduce((a, n) => a + n.score, 0) / nodes.length),
      quarantineThreshold: threshold,
    },
    nodes: nodes.map(n => ({ name: n.name, status: n.status, threatScore: n.score, signals: { jitterMs: Math.round(n.jitter), httpRisk: n.httpRisk, freqPerSec: Math.round(n.freq) } })),
    quarantineLog: qLog.map(e => ({ node: e.nodeName, time: e.time, score: e.score, reason: e.reason })),
    recentEvents: timeline.slice(0, 50).map(e => ({ time: e.time, type: e.type, message: e.message, severity: e.severity })),
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aegis-incident-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
