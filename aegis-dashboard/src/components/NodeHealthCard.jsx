import { HTTP_DISPLAY, scoreColor, statusColor } from '../engine/ThreatEngine';

function ThreatGauge({ score, size = 64 }) {
  const R = (size - 8) / 2;
  const C = 2 * Math.PI * R;
  const fill = (score / 100) * C;
  const color = scoreColor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="var(--bg-hover)" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${fill} ${C - fill}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .9s ease, stroke .5s', filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color, letterSpacing: 1 }}>{score}</div>
    </div>
  );
}

function Sparkline({ data, color, width = 90, height = 22 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 2)}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', opacity: 0.5 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.2} style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
    </svg>
  );
}

export default function NodeHealthCard({ node, onAttack }) {
  const sc = statusColor(node.status);
  const displayHttp = HTTP_DISPLAY[node.httpRisk] || 200;
  const isQ = node.status === 'quarantined';
  const httpCol = node.httpRisk >= 3 ? 'var(--red)' : node.httpRisk >= 2 ? 'var(--yellow)' : node.httpRisk >= 1 ? 'var(--blue)' : 'var(--green)';

  return (
    <div className={isQ ? 'node-card threat-pulse' : node.status === 'warning' ? 'node-card warn-pulse' : 'node-card'}
      style={{ borderColor: sc + '44' }}>
      {/* Header */}
      <div className="node-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, boxShadow: `0 0 8px ${sc}` }} />
          <span className="text-display" style={{ fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: 1 }}>{node.name}</span>
        </div>
        <span className={`badge ${isQ ? 'bg-red' : node.status === 'warning' ? 'bg-yellow' : 'bg-green'}`}>
          {node.status.toUpperCase()}
        </span>
      </div>

      {/* Gauge + Signals */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0' }}>
        <ThreatGauge score={node.score} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { lbl: 'JITTER', val: `${Math.round(node.jitter)}ms`, col: node.jitter > 300 ? 'var(--red)' : node.jitter > 100 ? 'var(--yellow)' : 'var(--green)' },
            { lbl: 'HTTP', val: displayHttp, col: httpCol },
            { lbl: 'REQ/S', val: Math.round(node.freq), col: node.freq > 80 ? 'var(--red)' : node.freq > 45 ? 'var(--yellow)' : 'var(--green)' },
          ].map(s => (
            <div key={s.lbl} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-dim" style={{ fontSize: '0.88rem' }}>{s.lbl}</span>
              <span style={{ fontSize: '0.95rem', color: s.col, fontFamily: 'var(--font-mono)' }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      <Sparkline data={node.scoreHistory} color={scoreColor(node.score)} />

      {/* Action */}
      {!isQ ? (
        <button className="btn-control" style={{ width: '100%', marginTop: 6, color: 'var(--red)', borderColor: 'var(--red-muted)' }}
          onClick={() => onAttack(node.id)}>⚡ INJECT ATTACK</button>
      ) : (
        <div className="text-red text-display" style={{ textAlign: 'center', fontSize: '0.88rem', marginTop: 6, letterSpacing: 2 }}>■ ISOLATED</div>
      )}
    </div>
  );
}
