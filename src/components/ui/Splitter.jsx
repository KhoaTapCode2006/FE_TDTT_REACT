import { useState, useEffect, useRef } from 'react';

/**
 * Splitter Component
 * 
 * A draggable vertical divider that allows users to resize adjacent panels.
 * Supports both mouse and touch events for desktop and mobile compatibility.
 * 
 * @param {Object} props
 * @param {number} [props.initialPosition=50] - Initial position as percentage (0-100)
 * @param {number} [props.minLeftWidth=30] - Minimum left panel width as percentage
 * @param {number} [props.minRightWidth=300] - Minimum right panel width in pixels
 * @param {Function} props.onPositionChange - Callback fired when position changes
 * @param {string} [props.className=''] - Additional CSS classes
 */
const Splitter = ({
  initialPosition = 50,
  minLeftWidth = 30,
  minRightWidth = 300,
  onPositionChange,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const containerRef = useRef(null);

  // Handle mouse down event - start dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle touch start event - start dragging on mobile
  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Calculate new position based on client X coordinate
  const calculatePosition = (clientX) => {
    if (!containerRef.current) return position;

    const container = containerRef.current.parentElement;
    if (!container) return position;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    // Calculate position as percentage
    const newPosition = ((clientX - containerRect.left) / containerWidth) * 100;

    // Calculate minimum right width as percentage
    const minRightPercent = (minRightWidth / containerWidth) * 100;

    // Enforce constraints
    const clampedPosition = Math.max(
      minLeftWidth,
      Math.min(100 - minRightPercent, newPosition)
    );

    return clampedPosition;
  };

  // Handle mouse move event - update position while dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newPosition = calculatePosition(e.clientX);
    setPosition(newPosition);
    
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  };

  // Handle touch move event - update position while dragging on mobile
  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newPosition = calculatePosition(touch.clientX);
    setPosition(newPosition);
    
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  };

  // Handle mouse up event - stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle touch end event - stop dragging on mobile
  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add global event listeners for mouse/touch move and up/end
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);

      // Restore text selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`splitter-container ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resizable panel divider"
      tabIndex={0}
      style={{
        position: 'relative',
        width: '8px',
        cursor: 'col-resize',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        transition: isDragging ? 'none' : 'background-color 0.2s ease',
        zIndex: 10
      }}
    >
      {/* Visual drag handle */}
      <div
        className="splitter-handle"
        style={{
          width: '4px',
          height: '48px',
          borderRadius: '2px',
          backgroundColor: isDragging ? '#1a2d24' : '#e0e0e0',
          transition: isDragging ? 'none' : 'all 0.2s ease',
          boxShadow: isDragging ? '0 2px 8px rgba(26, 45, 36, 0.2)' : 'none'
        }}
      />

      {/* Hover effect overlay */}
      <style>{`
        .splitter-container:hover .splitter-handle {
          background-color: #c19a6b;
          height: 64px;
        }
        
        .splitter-container:focus {
          outline: 2px solid #c19a6b;
          outline-offset: 2px;
        }
        
        .splitter-container:focus:not(:focus-visible) {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default Splitter;
