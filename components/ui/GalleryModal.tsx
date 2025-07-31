'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

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

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') next();
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [current]);

    const next = () =>
        setCurrent((prev) => (prev + 1) % images.length);
    const prev = () =>
        setCurrent((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="fixed inset-0 z-[71] bg-black/90 text-white flex flex-col items-center justify-center">
            {/* Close */}
            <button
                className="absolute top-24 md:top-5 right-5 p-2 bg-black/50 rounded-full hover:bg-black"
                onClick={onClose}
            >
                <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            <button
                className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black p-2 rounded-full"
                onClick={prev}
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black p-2 rounded-full"
                onClick={next}
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Zoom Toggle */}
            <button
                className="absolute bottom-5 right-5 p-2 bg-black/50 rounded-full hover:bg-black"
                onClick={() => setZoom(!zoom)}
            >
                {zoom ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>

            {/* Main Image */}
            <div className={`max-h-[70vh] max-w-[90vw] overflow-hidden mt-6`}>
                <img
                    src={src}
                    alt={currentImg.caption || 'Gallery image'}
                    className={`rounded-md mx-auto object-contain ${zoom ? 'scale-150' : 'scale-100'} transition-transform duration-300`}
                />
            </div>

            {/* Caption */}
            {currentImg.caption && (
                <p className="mt-2 text-sm opacity-80 max-w-xl text-center px-4">
                    {currentImg.caption}
                </p>
            )}

            {/* Thumbnail List */}
            <div className="flex overflow-x-auto gap-2 p-4 mt-6 bg-black/30 rounded-md max-w-[90vw]">
                {images.map((img, idx) => {
                    const thumb = img.url || `https://whatsyourinfo-media-worker.dishis.workers.dev/${img.key}`;
                    return (
                        <img
                            key={idx}
                            src={thumb}
                            alt="thumb"
                            onClick={() => setCurrent(idx)}
                            className={`w-16 h-16 object-cover rounded cursor-pointer ${idx === current ? 'ring-2 ring-white' : ''
                                }`}
                        />
                    );
                })}
            </div>
        </div>
    );
}
