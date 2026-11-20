import type { AxisScore } from '../types/career';

interface RadarChartProps {
  axes: AxisScore[];
}

export function RadarChart({ axes }: RadarChartProps) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 96;
  const count = axes.length || 6;

  const getPoint = (index: number, valueRatio: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * maxRadius * valueRatio,
      y: cy + Math.sin(angle) * maxRadius * valueRatio,
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = axes.map((axis, idx) => {
    const ratio = Math.max(0.1, Math.min(1, axis.score / 100));
    return getPoint(idx, ratio);
  });

  const polygonPoints = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full max-w-[320px]"
        role="img"
        aria-label="6개 커리어 성향 축 레이더 차트"
      >
        {gridLevels.map((level) => {
          const ringPoints = Array.from({ length: count }, (_, idx) => {
            const pt = getPoint(idx, level);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          }).join(' ');
          return (
            <polygon
              key={level}
              points={ringPoints}
              fill={level === 1 ? '#FAF8F5' : 'none'}
              stroke="#E6E1D8"
              strokeWidth="1"
            />
          );
        })}

        {axes.map((axis, idx) => {
          const edge = getPoint(idx, 1);
          return (
            <line
              key={axis.key}
              x1={cx}
              y1={cy}
              x2={edge.x}
              y2={edge.y}
              stroke="#E6E1D8"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={polygonPoints}
          fill="#2D7A6E"
          fillOpacity="0.18"
          stroke="#2D7A6E"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {dataPoints.map((pt, idx) => (
          <circle
            key={axes[idx].key}
            cx={pt.x}
            cy={pt.y}
            r="4"
            fill="#FFFFFF"
            stroke="#2D7A6E"
            strokeWidth="2"
          />
        ))}

        {axes.map((axis, idx) => {
          const labelPt = getPoint(idx, 1.28);
          const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
          const cos = Math.cos(angle);
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (cos > 0.25) textAnchor = 'start';
          if (cos < -0.25) textAnchor = 'end';

          return (
            <g key={axis.key}>
              <text
                x={labelPt.x}
                y={labelPt.y - 4}
                textAnchor={textAnchor}
                className="fill-[#232129] text-[12px] font-semibold"
              >
                {axis.label}
              </text>
              <text
                x={labelPt.x}
                y={labelPt.y + 12}
                textAnchor={textAnchor}
                className="fill-[#2D7A6E] font-mono text-[11px] font-medium"
              >
                {axis.score}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
