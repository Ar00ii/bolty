'use client';

export const NestedBoxesBackground = () => {
  return (
    <div className="relative w-full h-full">
      {/* Outer box */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.8)',
        }}
      />

      {/* Middle box */}
      <div
        className="absolute inset-6 rounded-lg"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.8)',
        }}
      />

      {/* Inner box */}
      <div
        className="absolute inset-12 rounded-lg"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.8)',
        }}
      />
    </div>
  );
};
