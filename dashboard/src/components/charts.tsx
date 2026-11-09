type Series = { label: string; color: string; values: number[] };

/** رسم خطي بسيط لسلسلتين — بدون مكتبات. */
export function LineChart({
  labels,
  series,
  height = 210,
}: {
  labels: string[];
  series: Series[];
  height?: number;
}) {
  const W = 620;
  const H = height;
  const padX = 34;
  const padY = 18;

  const all = series.flatMap((item) => item.values);
  const max = Math.max(1, ...all);
  const count = Math.max(1, labels.length - 1);

  const pointFor = (value: number, index: number) => {
    const x = padX + (index / count) * (W - padX * 2);
    const y = H - padY - (value / max) * (H - padY * 2);
    return [x, y] as const;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="رسم المبيعات">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padY + ratio * (H - padY * 2);
        return (
          <line
            key={ratio}
            x1={padX}
            x2={W - padX}
            y1={y}
            y2={y}
            stroke="rgba(31,35,24,0.08)"
            strokeDasharray="4 6"
          />
        );
      })}

      {series.map((item) => {
        const points = item.values.map((value, index) => pointFor(value, index));
        const path = points.map(([x, y]) => `${x},${y}`).join(' ');
        const area = `${padX},${H - padY} ${path} ${W - padX},${H - padY}`;
        return (
          <g key={item.label}>
            <polygon points={area} fill={item.color} opacity={0.08} />
            <polyline
              points={path}
              fill="none"
              stroke={item.color}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r={2.6} fill={item.color} />
            ))}
          </g>
        );
      })}

      {labels.map((label, index) => {
        const [x] = pointFor(0, index);
        return (
          <text
            key={label + index}
            x={x}
            y={H - 2}
            textAnchor="middle"
            fontSize={9.5}
            fill="#6b7159"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export type Slice = { label: string; value: number; color: string };

/** دونات بنِسَب مئوية. */
export function Donut({
  slices,
  size = 178,
  centerLabel,
  centerValue,
}: {
  slices: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="توزيع">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(31,35,24,0.07)"
        strokeWidth={16}
      />
      {total > 0 &&
        slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const element = (
            <circle
              key={slice.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={16}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
          offset += length;
          return element;
        })}

      {centerValue ? (
        <text
          x={size / 2}
          y={size / 2 - 2}
          textAnchor="middle"
          fontSize={19}
          fontWeight={800}
          fill="#37421c"
        >
          {centerValue}
        </text>
      ) : null}
      {centerLabel ? (
        <text x={size / 2} y={size / 2 + 15} textAnchor="middle" fontSize={10} fill="#6b7159">
          {centerLabel}
        </text>
      ) : null}
    </svg>
  );
}

/** أعمدة مزدوجة: الفترة الحالية مقابل السابقة. */
export function GroupedBars({
  items,
  height = 170,
  currentColor = '#4f5b2a',
  previousColor = '#d9a24a',
}: {
  items: { label: string; current: number; previous: number }[];
  height?: number;
  currentColor?: string;
  previousColor?: string;
}) {
  const max = Math.max(1, ...items.flatMap((item) => [item.current, item.previous]));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 4,
              height: '100%',
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 9.5, color: 'var(--muted)', fontWeight: 700 }}>
                {compact(item.previous)}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: 22,
                  height: Math.max(3, (item.previous / max) * (height - 30)),
                  borderRadius: '6px 6px 2px 2px',
                  background: previousColor,
                  opacity: 0.85,
                }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 9.5, color: 'var(--olive)', fontWeight: 700 }}>
                {compact(item.current)}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: 22,
                  height: Math.max(3, (item.current / max) * (height - 30)),
                  borderRadius: '6px 6px 2px 2px',
                  background: `linear-gradient(180deg, ${currentColor}, #6d7a3d)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 10,
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const compact = (value: number) =>
  value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value));

/** حلقة تقدّم صغيرة (نسبة مئوية). */
export function Ring({
  value,
  size = 74,
  color = '#4f5b2a',
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  label: string;
}) {
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, value));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(31,35,24,0.08)"
        strokeWidth={8}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${(safe / 100) * circumference} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight={800}
        fill="#37421c"
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
}
/** أعمدة رأسية. */
export function Bars({
  items,
  height = 150,
  color = '#4f5b2a',
}: {
  items: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const barWidth = 100 / Math.max(1, items.length);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          height,
          paddingTop: 8,
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <span style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700 }}>
              {item.value}
            </span>
            <div
              style={{
                width: '100%',
                maxWidth: `${barWidth}%`,
                height: Math.max(3, (item.value / max) * (height - 34)),
                borderRadius: '8px 8px 3px 3px',
                background: `linear-gradient(180deg, ${color}, rgba(184,134,47,0.75))`,
                transition: 'height 0.4s ease',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--muted)' }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
