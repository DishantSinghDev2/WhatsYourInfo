'use client';

import { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface GalleryImage {
  _id: string;
  url?: string;
  key: string;
  caption?: string;
}

export default function GalleryModal({
  images,
  initialIndex,
  onClose,
}: {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const [zoom, setZoom] = useState(false);

  const currentImg = images[current];
  const src =
    currentImg.url ||
    `https://whatsyourinfo-media-worker.dishis.workers.dev/${currentImg.key}`;

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden'; // Prevent scroll when modal open
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [current]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-end items-start p-4 sm:p-6">
        <button
          className="p-2 bg-black/50 hover:bg-black rounded-full"
          onClick={onClose}
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* Image Viewer */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Arrows */}
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black p-2 rounded-full"
          onClick={prev}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="relative w-full max-w-6xl max-h-[80vh] flex items-center justify-center overflow-hidden">
          <img
            src={src}
            alt={currentImg.caption || 'Gallery image'}
            className={`rounded-md object-contain max-h-full max-w-full transition-transform duration-300 ${zoom ? 'scale-150' : 'scale-100'}`}
          />
        </div>

        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black p-2 rounded-full"
          onClick={next}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Zoom Button */}
        <button
          className="absolute bottom-28 sm:bottom-24 right-4 z-20 p-2 bg-black/50 hover:bg-black rounded-full"
          onClick={() => setZoom(!zoom)}
        >
          {zoom ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </button>

        {/* Caption */}
        {currentImg.caption && (
          <p className="mt-4 text-sm text-center max-w-xl px-4 opacity-80">
            {currentImg.caption}
          </p>
        )}
      </div>

      {/* Thumbnail Navigator */}
      <div className="sticky bottom-0 left-0 right-0 bg-black/70 p-3 sm:p-4 overflow-x-auto flex gap-2 justify-center border-t border-white/10 z-50">
        {images.map((img, idx) => {
          const thumb =
            img.url ||
            `https://whatsyourinfo-media-worker.dishis.workers.dev/${img.key}`;
          return (
            <img
              key={idx}
              src={thumb}
              alt="thumb"
              onClick={() => setCurrent(idx)}
              className={`w-16 h-16 rounded object-cover border-2 cursor-pointer transition-all ${
                idx === current ? 'border-white' : 'border-transparent'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
