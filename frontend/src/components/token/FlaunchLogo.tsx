import React from 'react';

/**
 * Flaunch brand mark — stylized lowercase "ƒ" in a rounded square.
 * Keeps to Flaunch's palette (the "lime" they use on their own site).
 * Inline SVG so we don't ship another raster file and it scales
 * cleanly next to text at any size.
 */
export function FlaunchLogo({
  size = 16,
  className = '',
  monochrome = false,
}: {
  size?: number;
  className?: string;
  monochrome?: boolean;
}) {
  const id = React.useId();
  const fillId = `${id}-fill`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Flaunch"
      role="img"
    >
      {!monochrome && (
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C9FF41" />
            <stop offset="100%" stopColor="#7DDA2C" />
          </linearGradient>
        </defs>
      )}
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="9"
        fill={monochrome ? 'currentColor' : `url(#${fillId})`}
      />
      {/* stylized ƒ — straight vertical bar with crossbar and foot curl */}
      <path
        d="M20.6 9.8c-.3-.1-.8-.2-1.4-.2-1.9 0-3.1 1.3-3.1 3.7v1.5h-3.1v2.7h3.1v9.2h3.1V17.5h3.1v-2.7h-3.1v-1.3c0-1 .4-1.5 1.3-1.5.4 0 .7 0 1 .1l.1-2.3Z"
        fill={monochrome ? 'rgba(0,0,0,0.85)' : '#0A0A0F'}
      />
    </svg>
  );
}

export default FlaunchLogo;
