'use client';

import { useRef, useState } from 'react';
import { UserProfile } from '@/types';
import PublicProfileView from '@/components/profile/PublicProfileView';
import { GripVertical, X } from 'lucide-react';

export default function ProfilePreview({ 
  user, 
  isMobileView = false, 
  onClose 
}: { 
  user: UserProfile | null, 
  isMobileView?: boolean, 
  onClose?: () => void 
}) {
  const MIN_WIDTH = 520;
  const MAX_WIDTH = 900;

  const [width, setWidth] = useState(MAX_WIDTH);
  const previewRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const animationFrame = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = previewRef.current?.offsetWidth || MAX_WIDTH;

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      animationFrame.current = requestAnimationFrame(() => {
        const dx = moveEvent.clientX - startX;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth - dx));
        if (previewRef.current) {
          previewRef.current.style.width = `${newWidth}px`;
        }
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      const finalWidth = previewRef.current?.offsetWidth || width;
      setWidth(finalWidth);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!user) return null;

  return (
    // On mobile, the parent container controls the size.
    <div className={`h-full w-full flex justify-center items-center`}>
      <div
        ref={previewRef}
        className="relative h-full overflow-hidden"
        // Apply resizable width only on desktop view
        style={!isMobileView ? { width: `${width}px`, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH } : { width: '100%' }}
      >
        {/* --- CONDITIONAL: Show resizer only on desktop --- */}
        {!isMobileView && (
          <div
            className="absolute left-0 top-0 h-full w-10 z-20 flex items-center justify-start"
            onMouseDown={handleMouseDown}
          >
            <div className="w-2 h-full bg-gray-200 cursor-col-resize flex items-center justify-center ">
              <GripVertical className="h-4 w-2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* --- CONDITIONAL: Show close button only on mobile --- */}
        {isMobileView && onClose && (
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                aria-label="Close preview"
            >
                <X className="h-5 w-5"/>
            </button>
        )}

        <div className="h-full w-full overflow-y-auto custom-scrollbar">
          <PublicProfileView profile={user} />
        </div>
      </div>
    </div>
  );
}
