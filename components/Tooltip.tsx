import React from 'react';

interface TooltipProps {
  content: React.ReactNode;
  x: number;
  y: number;
  visible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ content, x, y, visible }) => {
  if (!visible) return null;

  const style = {
    top: `${y + 20}px`,
    left: `${x}px`,
    // Basic transform to keep it from being directly under the cursor and potentially flickering
    // A more advanced solution would check viewport boundaries.
    transform: 'translateX(-50%)', 
  };

  return (
    <div
      style={style}
      className="fixed z-50 p-3 text-xs text-gray-200 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl pointer-events-none transition-opacity duration-200 max-w-sm"
      role="tooltip"
    >
      {content}
    </div>
  );
};

export default Tooltip;
