import { ImageResponse } from 'next/og';

// iOS home-screen icon. Bigger than the favicon so the detail reads on
// retina displays, same branding.

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function AppleIcon() {
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
          borderRadius: 38,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M56 16 L36 52 L48 52 L42 84 L68 44 L54 44 L62 16 Z" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
