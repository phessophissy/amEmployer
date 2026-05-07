import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0f0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          border: '1px solid #00ff8840',
        }}
      >
        {/* "aE" brand mark in cyber-green */}
        <span
          style={{
            color: '#00ff88',
            fontSize: '15px',
            fontWeight: 900,
            fontFamily: 'monospace',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          aE
        </span>
      </div>
    ),
    { ...size }
  );
}
