'use client';

import { useState, useEffect } from 'react';

function getManaguaTime() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Managua' }));
}

export default function ClockFace({ size = 48 }: { size?: number }) {
  const [time, setTime] = useState(getManaguaTime());

  useEffect(() => {
    const id = setInterval(() => setTime(getManaguaTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = time.getHours() % 12;
  const m = time.getMinutes();
  const s = time.getSeconds();

  const hourAngle = (h + m / 60) * 30;
  const minuteAngle = (m + s / 60) * 6;
  const secondAngle = s * 6;

  const day = time.getDate();
  const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const month = monthNames[time.getMonth()];

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 4) / 2;

  const markers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const is12 = i === 0;
    const x1 = cx + (r - (is12 ? 10 : 6)) * Math.cos(angle);
    const y1 = cy + (r - (is12 ? 10 : 6)) * Math.sin(angle);
    const x2 = cx + (r - 2) * Math.cos(angle);
    const y2 = cy + (r - 2) * Math.sin(angle);
    const numX = cx + (r - 14) * Math.cos(angle);
    const numY = cy + (r - 14) * Math.sin(angle);
    const num = i === 0 ? 12 : i;
    return { x1, y1, x2, y2, numX, numY, num, is12 };
  });

  const handBase = (angle: number, length: number, width: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    const x = cx + length * Math.cos(rad);
    const y = cy + length * Math.sin(rad);
    return { x, y, width };
  };

  const hourHand = handBase(hourAngle, r * 0.45, 2.5);
  const minuteHand = handBase(minuteAngle, r * 0.68, 1.5);
  const secondHand = handBase(secondAngle, r * 0.72, 1);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      {/* Outer blue ring */}
      <circle cx={cx} cy={cy} r={r} fill="#0f172a" stroke="#3b82f6" strokeWidth={2.5} />
      {/* Inner black face */}
      <circle cx={cx} cy={cy} r={r - 3} fill="#0f172a" />
      {/* Subtle carbon texture circle */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="#334155" strokeWidth={0.5} opacity={0.4} />

      {/* Hour markers & numbers */}
      {markers.map((mk, i) => (
        <g key={i}>
          {mk.is12 ? (
            <path
              d={`M${mk.x1},${mk.y1 - 6} L${mk.x2},${mk.y2 + 3} L${mk.x1 - 5},${mk.y1 + 3} Z`}
              fill="white"
            />
          ) : (
            <line x1={mk.x1} y1={mk.y1} x2={mk.x2} y2={mk.y2} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
          )}
          <text
            x={mk.numX}
            y={mk.numY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={mk.is12 ? 8 : 6}
            fontWeight={mk.is12 ? 700 : 600}
            fontFamily="sans-serif"
          >
            {mk.num}
          </text>
        </g>
      ))}

      {/* Date box at 3 o'clock */}
      <rect x={cx + r * 0.35} y={cy - 5} width={14} height={10} rx={2} fill="#1e293b" stroke="#475569" strokeWidth={0.5} />
      <text x={cx + r * 0.35 + 7} y={cy + 0.5} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={5} fontWeight={700} fontFamily="sans-serif">
        {day}
      </text>

      {/* Month label above date */}
      <text x={cx + r * 0.35 + 7} y={cy - 7} textAnchor="middle" fill="#94a3b8" fontSize={3.5} fontWeight={600} fontFamily="sans-serif">
        {month}
      </text>

      {/* Hour hand */}
      <line x1={cx} y1={cy} x2={hourHand.x} y2={hourHand.y} stroke="white" strokeWidth={hourHand.width} strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={cx} y1={cy} x2={minuteHand.x} y2={minuteHand.y} stroke="white" strokeWidth={minuteHand.width} strokeLinecap="round" />
      {/* Second hand */}
      <line x1={cx} y1={cy + 3} x2={secondHand.x} y2={secondHand.y} stroke="#ef4444" strokeWidth={secondHand.width} strokeLinecap="round" />

      {/* Center pivot */}
      <circle cx={cx} cy={cy} r={2.5} fill="#0f172a" stroke="#ef4444" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={1} fill="#ef4444" />
    </svg>
  );
}
