'use client';

interface SkeletonLoaderProps {
  count?: number;
  shape?: 'rect' | 'circle' | 'card' | 'text' | 'table-row';
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonLoader({
  count = 1,
  shape = 'rect',
  width = '100%',
  height = '20px',
  className = '',
}: SkeletonLoaderProps) {
  const shapes = {
    circle: (
      <div
        key={0}
        className={`skeleton rounded-full ${className}`}
        style={{ width: height, height, minWidth: height }}
      />
    ),
    rect: <div key={0} className={`skeleton rounded-lg ${className}`} style={{ width, height }} />,
    text: Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className={`skeleton rounded-lg ${className}`}
        style={{ height: '16px', marginBottom: i < 2 ? '8px' : '0' }}
      />
    )),
    card: (
      <div
        key={0}
        className={`skeleton rounded-lg p-4 space-y-3 ${className}`}
        style={{ width, height: '200px' }}
      >
        <div className="skeleton rounded-lg h-12" />
        <div className="skeleton rounded-lg h-4" />
        <div className="skeleton rounded-lg h-4 w-3/4" />
      </div>
    ),
    'table-row': (
      <div
        key={0}
        className={`skeleton rounded-lg h-12 ${className}`}
        style={{ width, display: 'flex', gap: '16px' }}
      >
        <div className="skeleton rounded-lg flex-1 h-full" />
        <div className="skeleton rounded-lg flex-1 h-full" />
        <div className="skeleton rounded-lg flex-1 h-full" />
      </div>
    ),
  };

  const elements = [];
  for (let i = 0; i < count; i++) {
    if (shape === 'text' || shape === 'card') {
      elements.push(shapes[shape]);
    } else {
      elements.push(
        <div key={i} className="mb-3">
          {shapes[shape]}
        </div>,
      );
    }
  }

  return <div className="space-y-2">{elements}</div>;
}

// Pre-built loaders for common use cases
export function CardSkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton rounded-lg h-64" />
      ))}
    </div>
  );
}

export function ListSkeletonLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton rounded-lg h-12" />
      ))}
    </div>
  );
}

export function TableSkeletonLoader({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton rounded-lg flex-1 h-12" />
          ))}
        </div>
      ))}
    </div>
  );
}
