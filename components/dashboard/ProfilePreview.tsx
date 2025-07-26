'use client';

import { useRef, useState } from 'react';
import { UserProfile } from '@/types';
import PublicProfileView from '@/components/profile/PublicProfileView';
import { GripVertical } from 'lucide-react';

export default function ProfilePreview({ user }: { user: UserProfile | null }) {
  const MIN_WIDTH = 320;
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
    <div className="h-full w-full flex justify-center items-center bg-gray-100">
      <div
        ref={previewRef}
        className="relative h-full bg-white rounded-xl border shadow-md overflow-hidden"
        style={{ width: `${width}px`, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
      >
        {/* Slide Handle (larger hitbox, narrow visible area) */}
        <div
          className="absolute left-0 top-0 h-full w-10 z-20 flex items-center justify-start"
          onMouseDown={handleMouseDown}
        >
          <div className="w-4 h-full bg-gray-200 cursor-col-resize flex items-center justify-center rounded-r-md shadow-sm">
            <GripVertical className="h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Profile Preview */}
        <div className="h-full w-full overflow-y-auto custom-scrollbar">
          <PublicProfileView profile={user} isPreview />
        </div>
      </div>
    </div>
  );
}
