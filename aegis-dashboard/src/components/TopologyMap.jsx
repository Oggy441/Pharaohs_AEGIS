import { useMemo } from 'react';
import { statusColor } from '../engine/ThreatEngine';

const POSITIONS = [
  { x: 320, y: 40 }, { x: 510, y: 90 }, { x: 575, y: 210 }, { x: 510, y: 310 },
  { x: 320, y: 340 }, { x: 130, y: 310 }, { x: 65, y: 210 }, { x: 130, y: 90 },
];
const CENTER = { x: 320, y: 190 };
const EDGES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]];

export default function TopologyMap({ nodes, onNodeClick }) {
  const nodeMap = useMemo(() => { const m = {}; nodes.forEach(n => { m[n.id] = n; }); return m; }, [nodes]);

  return (
    <div style={{ width: '100%', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
      <svg viewBox="0 0 640 380" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <radialGradient id="tg"><stop offset="0%" stopColor="var(--green)" stopOpacity="0.04" /><stop offset="100%" stopOpacity="0" /></radialGradient>
          <filter id="gl"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <ellipse cx={CENTER.x} cy={CENTER.y} rx="280" ry="170" fill="url(#tg)" />

        {EDGES.map(([a,b], i) => {
          const na = nodeMap[a], nb = nodeMap[b];
          const alive = na && nb && na.status !== 'quarantined' && nb.status !== 'quarantined';
          const warn = (na?.status === 'warning') || (nb?.status === 'warning');
          const col = !alive ? 'var(--red-muted)' : warn ? 'var(--yellow-muted)' : 'var(--green-muted)';
          return <line key={`e${i}`} x1={POSITIONS[a].x} y1={POSITIONS[a].y} x2={POSITIONS[b].x} y2={POSITIONS[b].y}
            stroke={col} strokeWidth={alive ? 1.5 : 1} strokeDasharray={alive ? '6,4' : '3,6'}
            style={alive ? { animation: 'dataFlow 1.2s linear infinite' } : { opacity: 0.4 }} />;
        })}

        {POSITIONS.map((p, i) => <line key={`r${i}`} x1={p.x} y1={p.y} x2={CENTER.x} y2={CENTER.y}
          stroke={nodeMap[i]?.status === 'quarantined' ? 'var(--red-muted)' : 'rgba(0,255,136,0.12)'}
          strokeWidth={1} strokeDasharray="4,8"
          style={nodeMap[i]?.status !== 'quarantined' ? { animation: 'dataFlow 2s linear infinite' } : { opacity: 0.3 }} />)}

        <circle cx={CENTER.x} cy={CENTER.y} r={12} fill="var(--green-bg)" stroke="var(--green)" strokeWidth={1.5} filter="url(#gl)" opacity={0.7} />
        <circle cx={CENTER.x} cy={CENTER.y} r={4} fill="var(--green)" opacity={0.9} />
          <text x={CENTER.x} y={CENTER.y + 24} textAnchor="middle" fill="var(--text-dim)"
          style={{ fontSize: 13, fontFamily: 'var(--font-display)', letterSpacing: 2 }}>HUB</text>

        {nodes.map((node, i) => {
          const p = POSITIONS[i];
          const sc = statusColor(node.status);
          const isQ = node.status === 'quarantined';
          return (
            <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => !isQ && onNodeClick?.(node.id)}>
              {isQ && <circle cx={p.x} cy={p.y} r={22} fill="none" stroke="var(--red)" strokeWidth={1}
                style={{ animation: 'pulse 1.4s ease-in-out infinite', opacity: 0.5 }} />}
              <circle cx={p.x} cy={p.y} r={16} fill={`${sc}15`} stroke={sc} strokeWidth={2} filter="url(#gl)"
                style={{ transition: 'all 0.5s' }} />
              <circle cx={p.x} cy={p.y} r={5} fill={sc} style={{ transition: 'fill 0.5s', filter: `drop-shadow(0 0 4px ${sc})` }} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fill="var(--text-primary)"
                style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, pointerEvents: 'none' }}>{node.score}</text>
              <text x={p.x} y={p.y + 30} textAnchor="middle" fill={sc}
                style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{node.name}</text>
              {(isQ || node.status === 'warning') && <text x={p.x} y={p.y + 42} textAnchor="middle" fill="var(--text-dim)"
                style={{ fontSize: 10, fontFamily: 'var(--font-display)', letterSpacing: 1 }}>{isQ ? 'ISOLATED' : 'WARNING'}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
