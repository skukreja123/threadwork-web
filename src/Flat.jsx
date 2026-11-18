import { pathFor, shade } from './shapes';
export default function Flat({ pid, color, sleeve = 'short', side = 'front', design, className }) {
  const d = pathFor(pid, sleeve),
    e = shade(color, -45);
  return (
    <svg viewBox="0 0 400 440" className={className} role="img" aria-label={pid}>
      {pid === 'hoodie' && (
        <path
          d="M150 75Q200 -5 250 75Q200 110 150 75Z"
          fill={shade(color, -25)}
          stroke={e}
          strokeWidth="2"
        />
      )}
      <path d={d} fill={color} stroke={e} strokeWidth="2.5" strokeLinejoin="round" />
      {side === 'front' && pid === 'polo' && (
        <path
          d="M130 62L175 108L200 82L225 108L270 62Z M200 82V170"
          fill={shade(color, -20)}
          stroke={e}
          strokeWidth="2"
        />
      )}
      {side === 'front' && pid !== 'polo' && (
        <path d="M130 62Q200 100 270 62" fill="none" stroke={e} strokeWidth="4" />
      )}
      {design && design.src && (
        <image
          href={design.src}
          x={design.x - design.size / 2}
          y={design.y - design.size / 2}
          width={design.size}
          height={design.size}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </svg>
  );
}
