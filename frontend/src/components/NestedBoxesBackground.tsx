'use client';

export const NestedBoxesBackground = () => {
  return (
    <div className="relative w-full h-full min-h-96">
      {/* Outer box */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          border: '2px solid rgba(131, 110, 249, 0.5)',
        }}
      />

      {/* Middle box */}
      <div
        className="absolute inset-12 rounded-lg"
        style={{
          border: '2px solid rgba(6, 182, 212, 0.5)',
        }}
      />

      {/* Inner box */}
      <div
        className="absolute inset-24 rounded-lg"
        style={{
          border: '2px solid rgba(236, 72, 153, 0.5)',
        }}
      />
    </div>
  );
};
