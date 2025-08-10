'use client';

import { useRef, useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import PublicProfileView from '@/components/profile/PublicProfileView';
import { GripVertical, X } from 'lucide-react';

export default function ProfilePreview({
  user,
  isMobileView = false,
  onClose,
}: {
  user: UserProfile | null;
  isMobileView?: boolean;
  onClose?: () => void;
}) {
  const MIN_WIDTH = 520;
  const [maxWidth, setMaxWidth] = useState(3000); // Default maxWidth
  const [width, setWidth] = useState(3000);
  const previewRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    // Set max width dynamically on mount and on resize
    const updateMaxWidth = () => {
      const screenWidth = window.innerWidth;
      const dynamicMax = Math.max(MIN_WIDTH, screenWidth);
      setMaxWidth(dynamicMax);
      setWidth((w) => Math.min(w, dynamicMax));
    };

    updateMaxWidth();
    window.addEventListener('resize', updateMaxWidth);
    return () => window.removeEventListener('resize', updateMaxWidth);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = previewRef.current?.offsetWidth || maxWidth;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      animationFrame.current = requestAnimationFrame(() => {
        const dx = moveEvent.clientX - startX;
        const newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, startWidth - dx));
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
    <div className="h-full w-full flex justify-center items-center">
      <div
        ref={previewRef}
        className="relative h-full overflow-hidden max-w-full"
        style={
          !isMobileView
            ? { width: `${width}px`, minWidth: MIN_WIDTH, maxWidth: maxWidth }
            : { width: '100%' }
        }
      >
        {/* Resizer */}
        {!isMobileView && (
          <div
            className="absolute left-0 top-0 h-full w-10 z-20 flex items-center justify-start"
            onMouseDown={handleMouseDown}
          >
            <div className="w-2 h-full bg-gray-200 cursor-col-resize flex items-center justify-center">
              <GripVertical className="h-4 w-2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Close button on mobile */}
        {isMobileView && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="h-full w-full overflow-y-auto custom-scrollbar">
          <PublicProfileView profile={user} isPreview={true} />
        </div>
      </div>
    </div>
  );
}
