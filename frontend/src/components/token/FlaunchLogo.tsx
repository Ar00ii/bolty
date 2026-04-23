import React from 'react';

/**
 * Flaunch brand mark. Uses the PNG uploaded by the team under
 * /public/flaunch-logo.png so we always render the real logo instead
 * of a hand-drawn approximation. Consumers ignore the `monochrome`
 * prop now — the PNG already ships with its own colorway and a
 * transparent background so it works on dark surfaces.
 */
export function FlaunchLogo({
  size = 16,
  className = '',
  monochrome: _monochrome,
}: {
  size?: number;
  className?: string;
  monochrome?: boolean;
}) {
  void _monochrome;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/flaunch-logo.png"
      alt="Flaunch"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

export default FlaunchLogo;
