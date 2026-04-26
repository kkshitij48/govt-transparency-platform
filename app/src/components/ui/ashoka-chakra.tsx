// Shared Ashoka Chakra SVG — rounding coordinates to 4 decimal places
// prevents floating-point hydration mismatches between Node.js and browser engines.

export function AshokaChakra({
  size = 28,
  color = '#1B3A6B',
}: {
  size?: number;
  color?: string;
}) {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const rad = ((i * 360) / 24) * (Math.PI / 180);
    return {
      x1: +(50 + 9  * Math.cos(rad)).toFixed(4),
      y1: +(50 + 9  * Math.sin(rad)).toFixed(4),
      x2: +(50 + 42 * Math.cos(rad)).toFixed(4),
      y2: +(50 + 42 * Math.sin(rad)).toFixed(4),
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="4.5" fill="none" />
      <circle cx="50" cy="50" r="6" fill={color} />
      {spokes.map((s, i) => (
        <line
          key={i}
          x1={s.x1} y1={s.y1}
          x2={s.x2} y2={s.y2}
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
