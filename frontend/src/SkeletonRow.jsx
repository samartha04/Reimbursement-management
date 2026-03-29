import React from 'react';

const SkeletonRow = ({ cols = 4 }) => {
  return (
    <div className="flex items-center gap-4 py-4 px-4 border-b border-border1 w-full" style={{ animation: 'pulse 1.5s infinite' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-surface2 rounded" style={{ flex: 1 }}></div>
      ))}
    </div>
  );
};

export default SkeletonRow;
