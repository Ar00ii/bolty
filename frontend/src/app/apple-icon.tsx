export const size = { width: 180, height: 180 };
export const contentType = 'image/svg+xml';
export const dynamic = 'force-static';

export default function AppleIcon() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8b5cf6"/>
          <stop offset="100%" stop-color="#6d28d9"/>
        </linearGradient>
      </defs>
      <rect width="180" height="180" rx="40" fill="url(#g)"/>
      <path d="M55.313 89.532L50 109.375l-5.313-19.843a28.125 28.125 0 00-19.312-19.313L5.625 65l20.75-5.313a28.125 28.125 0 0019.313-19.312L50 20.625l5.313 19.75a28.125 28.125 0 0019.312 19.312L94.375 65l-19.75 5.313a28.125 28.125 0 00-19.312 19.219z" fill="white" stroke="none"/>
      <path d="M113.675 54.3l2.825-10.05 2.825 10.05a14.063 14.063 0 009.375 9.375l10.05 2.825-10.05 2.825a14.063 14.063 0 00-9.375 9.375l-2.825 10.05-2.825-10.05a14.063 14.063 0 00-9.375-9.375l-10.05-2.825 10.05-2.825a14.063 14.063 0 009.375-9.375z" fill="white" stroke="none"/>
    </svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
}
