'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import { GripVertical, Eye, EyeOff, UploadCloud } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '@radix-ui/react-dropdown-menu';
import { CustomColorMenu } from '@/components/color-selector/CustomColourMenu';

const colorThemes = {
  Classic: { background: '#FFFFFF', surface: '#F8F9FA', accent: '#007BFF' },
  Sunset: { background: '#2C3E50', surface: '#34495E', accent: '#E74C3C' },
  Mint: { background: '#F0FFF4', surface: '#FFFFFF', accent: '#38A169' },
  Nite: { background: '#111827', surface: '#1F2937', accent: '#3B82F6' },
  Solar: { background: '#FDF6E3', surface: '#FBF1D5', accent: '#B58900' },
  Rose: { background: '#FFF1F2', surface: '#FFFFFF', accent: '#DB2777' },
  Forest: { background: '#1A2A27', surface: '#2D423F', accent: '#4ADE80' },
  Cyber: { background: '#000000', surface: '#1A1A1A', accent: '#F000B8' },
};

const defaultSections = ['Introduction', 'Links', 'Photos', 'Verified accounts', 'Interests'];

export default function DesignPanel({
  user,
  onUpdate,
  changesSaved
}: {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
  changesSaved: (a: boolean) => void
}) {
  const [design, setDesign] = useState(user.design || {});
  const [sectionOrder, setSectionOrder] = useState<string[]>(user.design?.sections || defaultSections);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    defaultSections.reduce((acc, s) => {
      acc[s] = user.design?.visibility?.[s] ?? true;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(true);
      changesSaved(false)
  }, [JSON.stringify(design), sectionOrder, JSON.stringify(visibility)]);


  const toggleVisibility = (section: string) => {
    if (section === 'Introduction') return;
    setVisibility(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleThemeClick = (name: string, colors: any) => {
    setDesign({ ...design, theme: name.toLowerCase(), customColors: colors });
  };

  const handleImageUpload = async (type: 'header' | 'background', file: File) => {
    const toastId = toast.loading('Uploading...');
    const form = new FormData();
    form.append(type, file);
    const res = await fetch(`/api/profile/design-image?type=${type}`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      toast.error('Upload failed', { id: toastId });
    } else {
      const data = await res.json();
      setDesign(prev => ({ ...prev, [`${type}Image`]: data.url }));
      toast.success('Uploaded!', { id: toastId });
      setHasChanges(true);
      changesSaved(true)
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving...');
    try {
      const payload = {
        design: {
          ...design,
          sections: sectionOrder,
          visibility,
        }
      };

      const res = await fetch('/api/profile/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.design),
      });
      if (!res.ok) throw new Error();
      onUpdate(payload);
      toast.success('Saved!', { id: toastId });
      setHasChanges(false);
      changesSaved(true)
    } catch {
      toast.error('Save failed.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-sm">
      <h2 className="text-lg font-semibold">Design</h2>
      <p className="text-muted-foreground mb-2">Customize your public profile with images and colors.</p>

      <div>
        <h3 className="text-sm font-medium mb-2">Colors</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Object.entries(colorThemes).map(([name, colors]) => {
            const isSelected = design.theme === name.toLowerCase()
            return (
              <button
                key={name}
                onClick={() => handleThemeClick(name, colors)}
                className={`relative border rounded-md p-3 text-left group transition-all duration-300 h-[90px] ${isSelected ? 'border-black shadow-md bg-gray-50' : 'border-gray-200'
                  }`}
              >
                <div className="relative h-6 w-6 mx-auto mt-1 flex justify-center">
                  {/* Circle 1 - Bottom */}
                  <span
                    className="absolute w-6 h-6 border border-gray-500 rounded-full bg-white transition-all duration-300 group-hover:translate-y-[-10px] group-hover:scale-110 z-10"
                    style={{ background: colors.surface }}
                  />
                  {/* Circle 2 - Middle */}
                  <span
                    className="absolute w-6 h-6 border border-gray-500 rounded-full bg-white translate-y-[6px] transition-all duration-300 group-hover:translate-y-[0px] group-hover:scale-110 z-20"
                    style={{ background: colors.background }}
                  />
                  {/* Circle 3 - Top */}
                  <span
                    className="absolute w-6 h-6 border border-gray-500 rounded-full bg-white translate-y-[12px] transition-all duration-300 group-hover:translate-y-[10px] group-hover:scale-110 z-30"
                    style={{ background: colors.accent }}
                  />
                </div>

                <span className="block text-xs mt-6 text-center font-medium">
                  {name}
                </span>
              </button>
            )
          })}

        </div>
        <CustomColorMenu design={design} setDesign={setDesign} />


        {/* Animated Custom Color Pickers */}

      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Sections & Visibility</h3>
        <Reorder.Group
          axis="y"
          values={sectionOrder}
          onReorder={setSectionOrder}
          className="space-y-2"
        >
          {sectionOrder.map(section => (
            <Reorder.Item
              key={section}
              value={section}
              className="bg-white flex justify-between items-center p-2 rounded-md border"
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${section === 'Introduction' ? 'font-bold' : ''}`}>
                  {section}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleVisibility(section)}
                  disabled={section === 'Introduction'}
                  className="text-gray-500"
                >
                  {visibility[section] ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Image upload options */}
      <div>
        <h3 className="text-sm font-medium mb-2">Images</h3>
        <div className="flex gap-4">
          {(['header', 'background'] as const).map((type) => (
            <DropdownMenu key={type}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <UploadCloud /> {type === 'header' ? 'Header' : 'Background'} Image
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <label className="cursor-pointer w-full">
                    Upload file...
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        file && handleImageUpload(type, file);
                      }}
                    />
                  </label>
                </DropdownMenuItem>
                {design[`${type}Image`] && (
                  <DropdownMenuItem onSelect={() => {
                    setDesign(prev => ({ ...prev, [`${type}Image`]: undefined }));
                    setHasChanges(true);
                  }}>
                    Remove existing
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </div>

      {hasChanges && (
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Design'}
          </Button>
        </div>
      )}
    </div>
  );
}
