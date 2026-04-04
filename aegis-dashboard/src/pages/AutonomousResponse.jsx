import { useState, useEffect, useCallback } from 'react';
import Panel from '../components/Panel';
import NodeHealthCard from '../components/NodeHealthCard';
import TopologyMap from '../components/TopologyMap';
import { calcThreatScore, createSimNode, generateAttackVector, calcDefcon, NODE_NAMES, ML_WEIGHTS, scoreColor, sevColor, exportReport } from '../engine/ThreatEngine';
import './AutonomousResponse.css';

export default function AutonomousResponse() {
  const [nodes, setNodes] = useState(() => Array.from({ length: 8 }, (_, i) => createSimNode(i)));
  const [timeline, setTimeline] = useState([]);
  const [qLog, setQLog] = useState([]);
  const [threshold, setThreshold] = useState(75);
  const [running, setRunning] = useState(true);
  const [clock, setClock] = useState('');

  useEffect(() => { const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-GB')), 1000); return () => clearInterval(t); }, []);

  const addEvent = useCallback((type, node, message, severity) => {
    setTimeline(prev => [{ id: Date.now() + Math.random(), time: new Date().toLocaleTimeString('en-GB'), type, node, message, severity }, ...prev].slice(0, 200));
  }, []);

  const quarantine = useCallback((node) => {
    const reason = `Jitter:${Math.round(node.jitter)}ms | HTTP-Risk:${node.httpRisk}/3 | Freq:${Math.round(node.freq)}/s`;
    setQLog(prev => [{ id: Date.now() + Math.random(), nodeName: node.name, time: new Date().toLocaleTimeString('en-GB'), reason, score: node.score }, ...prev]);
    addEvent('QUARANTINE', node.name, `Node ${node.name} AUTO-ISOLATED — score:${node.score} | ${reason}`, 'critical');
  }, [addEvent]);

  useEffect(() => {
    const t1 = setTimeout(() => addEvent('SYSTEM', 'GRID', 'AEGIS Defense Grid ONLINE — monitoring 8 nodes', 'info'), 400);
    const t2 = setTimeout(() => addEvent('SYSTEM', 'GRID', `ML Threat Engine loaded — RF (${ML_WEIGHTS.accuracy}% acc on ${ML_WEIGHTS.trainRecords.toLocaleString()} NSL-KDD records)`, 'info'), 900);
    const t3 = setTimeout(() => addEvent('SYSTEM', 'GRID', `Quarantine threshold: ${threshold} — autonomous response ARMED`, 'info'), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setNodes(prev => prev.map(n => {
        if (n.status === 'quarantined') return { ...n, uptime: n.uptime + 1 };
        const jitter = Math.max(8, n.jitter + (Math.random() - 0.47) * 40 + (65 - n.jitter) * 0.08);
        const httpRoll = Math.random();
        const httpRisk = httpRoll < 0.02 ? 3 : httpRoll < 0.06 ? 2 : httpRoll < 0.14 ? 1 : 0;
        const freq = Math.max(1, n.freq + (Math.random() - 0.47) * 14 + (22 - n.freq) * 0.06);
        const score = calcThreatScore({ jitter, httpRisk, freq });
        let status = 'active';
        if (score >= threshold) status = 'quarantined';
        else if (score >= threshold * 0.6) status = 'warning';
        const scoreHistory = [...n.scoreHistory.slice(1), score];
        const upd = { ...n, jitter, httpRisk, freq, score, status, scoreHistory, uptime: n.uptime + 1 };
        if (status === 'quarantined' && n.status !== 'quarantined') quarantine(upd);
        else if (status === 'warning' && n.status === 'active') addEvent('WARNING', n.name, `Node ${n.name} elevated — score ${score}`, 'warning');
        return upd;
      }));
    }, 1800);
    return () => clearInterval(id);
  }, [running, threshold, quarantine, addEvent]);

  const resetGrid = () => { setNodes(Array.from({ length: 8 }, (_, i) => createSimNode(i))); setTimeline([]); setQLog([]); setTimeout(() => addEvent('SYSTEM', 'GRID', 'Grid reset — all nodes restored', 'info'), 60); };
  const injectAttack = (nodeId) => { const atk = generateAttackVector(); setNodes(prev => prev.map(n => n.id !== nodeId ? n : { ...n, ...atk })); addEvent('ATTACK', NODE_NAMES[nodeId], `Attack vector injected → ${NODE_NAMES[nodeId]}`, 'critical'); };

  const active = nodes.filter(n => n.status === 'active').length;
  const warning = nodes.filter(n => n.status === 'warning').length;
  const quarantined = nodes.filter(n => n.status === 'quarantined').length;
  const avgScore = Math.round(nodes.reduce((a, n) => a + n.score, 0) / nodes.length);
  const gridHealth = Math.round(((active + warning * 0.5) / nodes.length) * 100);
  const defcon = calcDefcon(quarantined, avgScore);

  return (
    <div className="ar-page fade-in">
      {/* DEFCON + Stats Bar */}
      <div className="ar-stats-bar">
        <div className="ar-defcon">
          <span className="text-dim" style={{ fontSize: '0.82rem', letterSpacing: 2 }}>DEFCON</span>
          <span className={`defcon-num ${defcon.cls}`}>{defcon.level}</span>
          <span className={defcon.cls} style={{ fontSize: '0.88rem' }}>{defcon.label}</span>
        </div>
        {[
          { l: 'ACTIVE', v: active, c: 'text-green' },
          { l: 'WARNING', v: warning, c: 'text-yellow' },
          { l: 'QUARANTINED', v: quarantined, c: 'text-red' },
          { l: 'AVG THREAT', v: avgScore, c: avgScore >= 45 ? 'text-red' : 'text-green' },
          { l: 'GRID HEALTH', v: `${gridHealth}%`, c: gridHealth > 70 ? 'text-green' : 'text-red' },
        ].map(s => (
          <div key={s.l} className="ar-stat-card">
            <span className="text-dim" style={{ fontSize: '0.82rem', letterSpacing: 1 }}>{s.l}</span>
            <span className={`ar-stat-val ${s.c}`}>{s.v}</span>
          </div>
        ))}
        <div className="ar-controls">
          <button className={`btn-control ${running ? '' : 'active'}`} onClick={() => setRunning(r => !r)}>
            {running ? '⏸ PAUSE' : '▶ RESUME'}
          </button>
          <button className="btn-control" onClick={resetGrid}>↺ RESET</button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="ar-grid">
        {/* Left — Topology + Nodes */}
        <div className="ar-left">
          <Panel title="Network Topology" icon="NET">
            <TopologyMap nodes={nodes} onNodeClick={injectAttack} />
          </Panel>
          <Panel title="Node Health Monitor" icon="HEALTH" controls={
            <span className="text-dim" style={{ fontSize: '0.88rem' }}>{active}/8 ONLINE · {clock}</span>
          }>
            <div className="ar-node-grid">
              {nodes.map(n => <NodeHealthCard key={n.id} node={n} onAttack={injectAttack} />)}
            </div>
          </Panel>
        </div>

        {/* Right — Timeline + Q-Log + Simulator */}
        <div className="ar-right">
          {/* Threshold Slider */}
          <Panel title="Quarantine Threshold" icon="CTRL">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <input type="range" min={20} max={95} value={threshold} onChange={e => setThreshold(+e.target.value)}
                style={{ flex: 1, accentColor: 'var(--green)' }} />
              <span className="text-green text-display" style={{ fontSize: '1.7rem', minWidth: 40 }}>{threshold}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span className="text-dim">20 — aggressive</span><span className="text-dim">95 — lenient</span>
            </div>
          </Panel>

          {/* Attack Timeline */}
          <Panel title="Attack Timeline" icon="FEED" className="flex-panel" controls={
            <span className="badge bg-red">{timeline.length}</span>
          }>
            <div className="ar-timeline-scroll">
              {timeline.length === 0 ? <div className="text-dim" style={{ textAlign: 'center', padding: 20 }}>// awaiting events</div>
              : timeline.map(e => (
                <div key={e.id} className="ar-event animate-fade" style={{ borderLeftColor: sevColor(e.severity) }}>
                  <span className="text-dim" style={{ minWidth: 60, flexShrink: 0 }}>{e.time}</span>
                  <span style={{ color: sevColor(e.severity), minWidth: 80, fontWeight: e.severity === 'critical' ? 700 : 400 }}>[{e.type}]</span>
                  <span className="text-secondary" style={{ wordBreak: 'break-word' }}>{e.message}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Quarantine Log */}
          <Panel title="Quarantine Log" icon="LOCK" controls={
            <span className="badge bg-red">{qLog.length}</span>
          }>
            <div className="ar-qlog-scroll">
              {qLog.length === 0 ? <div className="text-dim" style={{ textAlign: 'center', padding: 20 }}>// no nodes isolated</div>
              : qLog.map(e => (
                <div key={e.id} className="ar-qlog-item animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="text-red text-display" style={{ fontSize: '1rem', letterSpacing: 1 }}>{e.nodeName}</span>
                    <span className="text-dim" style={{ fontSize: '0.88rem' }}>{e.time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="text-dim" style={{ fontSize: '0.85rem' }}>SCORE</span>
                    <span className="text-red text-display" style={{ fontSize: '1.5rem' }}>{e.score}</span>
                    <span className="text-dim" style={{ fontSize: '0.85rem' }}>/100</span>
                  </div>
                  <div className="text-dim" style={{ fontSize: '0.85rem', background: 'var(--red-bg)', padding: '4px 8px', borderRadius: 'var(--radius)' }}>{e.reason}</div>
                </div>
              ))}
            </div>
          </Panel>

          {/* ML Model Info */}
          <Panel title="ML Threat Engine" icon="ML">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="text-dim" style={{ fontSize: '0.9rem' }}>Accuracy (NSL-KDD)</span>
              <span className="text-green text-display" style={{ fontSize: '1.35rem' }}>{ML_WEIGHTS.accuracy}%</span>
            </div>
            {[
              { n: 'HTTP Risk', v: ML_WEIGHTS.featureImportances.http_risk, c: 'var(--red)' },
              { n: 'Request Freq', v: ML_WEIGHTS.featureImportances.request_freq, c: 'var(--yellow)' },
              { n: 'Latency Jitter', v: ML_WEIGHTS.featureImportances.latency_jitter, c: 'var(--blue)' },
            ].map(f => (
              <div key={f.n} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.9rem' }}>{f.n}</span>
                  <span className="text-display" style={{ fontSize: '0.92rem', color: f.c }}>{(f.v * 100).toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--bg-hover)', borderRadius: 2 }}>
                  <div style={{ width: `${f.v * 100}%`, height: '100%', background: f.c, borderRadius: 2, boxShadow: `0 0 6px ${f.c}` }} />
                </div>
              </div>
            ))}
            <div className="text-dim" style={{ fontSize: '0.82rem', marginTop: 8, fontStyle: 'italic' }}>
              Trained on {ML_WEIGHTS.trainRecords.toLocaleString()} real NSL-KDD records. Model: {ML_WEIGHTS.model}
            </div>
          </Panel>

          {/* Export */}
          <button className="btn-control ar-export-btn" onClick={() => exportReport(nodes, timeline, qLog, threshold)}>
            📊 EXPORT INCIDENT REPORT
          </button>
        </div>
      </div>
    </div>
  );
}
