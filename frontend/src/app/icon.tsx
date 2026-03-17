export const size = { width: 32, height: 32 };
export const contentType = 'image/svg+xml';
export const dynamic = 'force-static';

export default function Icon() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8b5cf6"/>
          <stop offset="100%" stop-color="#6d28d9"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#g)"/>
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" fill="white" stroke="none"/>
      <path d="M18.188 8.688l.437-1.562.438 1.562a2.25 2.25 0 001.5 1.5l1.563.438-1.563.437a2.25 2.25 0 00-1.5 1.5l-.438 1.563-.437-1.563a2.25 2.25 0 00-1.5-1.5l-1.563-.437 1.563-.438a2.25 2.25 0 001.5-1.5z" fill="white" stroke="none"/>
    </svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
}
