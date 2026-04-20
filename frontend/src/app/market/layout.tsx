import React from 'react';

// The global AppShell (rendered by ClientShell) already provides the
// dashboard chrome + .mk-scope for every non-landing / non-auth route,
// so the market segment just passes children through.
export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
