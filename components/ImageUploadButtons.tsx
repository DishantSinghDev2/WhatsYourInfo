'use client';

import { useEffect, useRef, useState } from 'react';
import { UploadCloud, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import ProCrownBadge from './icon/pro';

interface Props {
  design: Record<string, any>;
  onUploadComplete: (type: 'header' | 'background', url: string) => void;
  handleRemoveImage: (type: 'header' | 'background') => void;
  onDesignSettingsChange: (changes: { backgroundBlur?: number; backgroundOpacity?: number }) => void;
  isPro?: boolean;
}

const GALLERY_IMAGES: Record<'header' | 'background', string[]> = {
  header: ['/assets/header/header-1.jpg', '/assets/header/header-2.jpeg', '/assets/header/header-3.jpg', '/assets/header/header-4.jpg'],
  background: ['/assets/bg/bg-1.jpg', '/assets/bg/bg-2.jpeg', '/assets/bg/bg-3.png', '/assets/bg/bg-4.jpg'],
};

export default function ImageUploadButtons({
  design,
  onUploadComplete,
  handleRemoveImage,
  onDesignSettingsChange,
  isPro
}: Props) {
  const inputRefs = {
    header: useRef<HTMLInputElement>(null),
    background: useRef<HTMLInputElement>(null),
  };

  const [uploadingType, setUploadingType] = useState<null | 'header' | 'background'>(null);
  const [expandedGallery, setExpandedGallery] = useState<null | 'header' | 'background'>(null);
  const [blur, setBlur] = useState(design.backgroundBlur || 0);
  const [opacity, setOpacity] = useState(design.backgroundOpacity ?? 100);
  const [selectedGallery, setSelectedGallery] = useState<{
    header: string | null;
    background: string | null;
  }>({
    header: design.headerImage?.startsWith('/assets/') ? design.headerImage : null,
    background: design.backgroundImage?.startsWith('/assets/') ? design.backgroundImage : null,
  });

  useEffect(() => {
    if (selectedGallery.header) setExpandedGallery('header');
    if (selectedGallery.background) setExpandedGallery('background');
  }, []);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMB = type === 'header' ? 2 : 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSizeMB}MB allowed.`);
      return;
    }

    setUploadingType(type);
    const toastId = toast.loading(`Uploading ${type} image...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await fetch('/api/profile/design-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      toast.success('Image uploaded!', { id: toastId });
      onUploadComplete(type, data.imageUrl);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      setUploadingType(null);
      e.target.value = '';
    }
  };

  const updateBlur = (val: number) => {
    val = Math.max(0, Math.min(20, val));
    setBlur(val);
    onDesignSettingsChange({ backgroundBlur: val });
  };

  const updateOpacity = (val: number) => {
    val = Math.max(0, Math.min(100, val));
    setOpacity(val);
    onDesignSettingsChange({ backgroundOpacity: val });
  };

  const handleGallerySelect = (type: 'header' | 'background', url: string) => {
    const current = design[`${type}Image`] || '';
    if (current && !current.startsWith('/assets/')) {
      handleRemoveImage(type);
    }
    setSelectedGallery((prev) => ({ ...prev, [type]: url }));
    onUploadComplete(type, url);
  };


  const toggleGallery = (type: 'header' | 'background') => {
    setExpandedGallery((prev) => (prev === type ? null : type));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Images</h3>

      {(['header', 'background'] as const).map((type) => {
        const imageExists = !!design[`${type}Image`];
        const isUploading = uploadingType === type;

        return (
          <div key={type} className="space-y-2">
            {/* Upload Button */}
            <button
              type="button"
              onClick={() => inputRefs[type].current?.click()}
              className={`${(type === "background" && !isPro) ? 'bg-gray-200 transition duration-300' : "bg-white hover:border-gray-500 transition duration-300"} flex items-center justify-between p-3 rounded-lg border  relative w-full`}
              disabled={isUploading || (type === "background" && !isPro)}
            >
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                hidden
                ref={inputRefs[type]}
                onChange={(e) => handleFileChange(e, type)}
              />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md relative">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : (
                    <UploadCloud size={18} className="text-gray-500" />
                  )}
                  {imageExists && !isUploading && (
                    <span
                      className="absolute -top-2 -right-2 p-1 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(type);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-800 capitalize">
                      Custom {type}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {isUploading ? 'Uploading...' : imageExists ? (
                  <>
                  {type === "background" && !isPro ? <ProCrownBadge /> : (
                    <>
                      Change
                    </>
                  )}
                  </>
                ) : (
                  <>
                  {type === "background" && !isPro ? <ProCrownBadge /> : (
                    <>
                      Update
                    </>
                  )}
                  </>
                )}
              </span>
            </button>

            {/* Toggle Gallery */}
            <button
              type="button"
              onClick={() => toggleGallery(type)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              {expandedGallery === type ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Gallery
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Choose from gallery
                </>
              )}
            </button>

            {/* Gallery Preview Grid */}
            <div
              className={clsx(
                'transition-all overflow-hidden duration-500 grid grid-cols-2 sm:grid-cols-4 gap-3',
                expandedGallery === type ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'
              )}
            >
              {GALLERY_IMAGES[type].map((url) => (
                <button
                  key={url}
                  onClick={() => handleGallerySelect(type, url)}
                  className={clsx(
                    'relative border rounded-lg overflow-hidden hover:scale-[1.02] transition-transform',
                    selectedGallery[type] === url ? 'ring-2 ring-blue-500' : ''
                  )}
                  disabled={isUploading || (type === "background" && !isPro)}
                >
                  <img
                    src={url}
                    alt={url}
                    loading="lazy"
                    className={clsx(
                      'object-cover w-full h-20 transition-opacity duration-300',
                      'opacity-90 scale-100 hover:blur-0 hover:opacity-100'
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Extra: Background sliders only for background image */}
            {type === 'background' && !!design.backgroundImage && (
              <div
                className={clsx(
                  'transition-all duration-500 ease-in-out overflow-hidden',
                  design.backgroundImage ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                <div className="space-y-4 bg-white border rounded-lg p-4 mt-2">
                  {/* Blur */}
                  <div>
                    <label htmlFor="blur" className="block text-xs font-medium text-gray-600 mb-1">
                      Background Blur
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        id="blur"
                        min={0}
                        max={20}
                        step={0.1}
                        value={blur}
                        onChange={(e) => updateBlur(parseFloat(e.target.value))}
                        className="w-full accent-gray-700 [&::-webkit-slider-thumb]:rounded-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.1}
                        value={blur}
                        onChange={(e) => updateBlur(parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 border text-xs rounded-md"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  </div>

                  {/* Opacity */}
                  <div>
                    <label htmlFor="opacity" className="block text-xs font-medium text-gray-600 mb-1">
                      Background Opacity
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        id="opacity"
                        min={0}
                        max={100}
                        step={1}
                        value={opacity}
                        onChange={(e) => updateOpacity(parseFloat(e.target.value))}
                        className="w-full accent-gray-700 [&::-webkit-slider-thumb]:rounded-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={opacity}
                        onChange={(e) => updateOpacity(parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 border text-xs rounded-md"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
