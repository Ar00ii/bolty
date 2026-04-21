import { ImageResponse } from 'next/og';

// Bolty favicon — dynamic, generated at build time via ImageResponse so
// we never ship a non-square PNG again. Branded lightning bolt inside a
// rounded purple square on a transparent background.

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #836EF9 0%, #6E5AE7 100%)',
          borderRadius: 14,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M56 16 L36 52 L48 52 L42 84 L68 44 L54 44 L62 16 Z" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
