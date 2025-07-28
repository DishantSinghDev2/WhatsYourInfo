// components/DesignPanel.tsx

'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import { GripVertical, Eye, EyeOff, Lock } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { CustomColorMenu } from '@/components/color-selector/CustomColourMenu';
import ImageUploadButtons from '@/components/ImageUploadButtons';

// ... (ALL_SECTIONS and colorThemes constants remain the same) ...
const ALL_SECTIONS = [
  { key: 'Introduction', name: 'Introduction', pro: false, isPinned: true },
  { key: 'Links', name: 'Links', pro: false, isPinned: false },
  { key: 'Wallet', name: 'Wallet', pro: false, isPinned: false },
  { key: 'Gallery', name: 'Photos', pro: false, isPinned: false },
  { key: 'VerifiedAccounts', name: 'Verified Accounts', pro: false, isPinned: false },
  { key: 'Interests', name: 'Interests', pro: false, isPinned: false },
  { key: 'LeadCapture', name: 'Lead Capture (Pro)', pro: true, isPinned: false },
];

export const colorThemes = {
  Classic: { background: '#FFFFFF', surface: '#F8F9FA', accent: '#2563EB' },
  Minimal: { background: '#FAFAFA', surface: '#FFFFFF', accent: '#111827' },
  Sunset: { background: '#2C3E50', surface: '#34495E', accent: '#E74C3C' },
  Mint: { background: '#F0FFF4', surface: '#FFFFFF', accent: '#10B981' },
  Nite: { background: '#0F172A', surface: '#1E293B', accent: '#3B82F6' },
  Solar: { background: '#FDF6E3', surface: '#F5EFC1', accent: '#B58900' },
  Rose: { background: '#FFF1F2', surface: '#FEE2E2', accent: '#E11D48' },
  Forest: { background: '#1A2A27', surface: '#2D423F', accent: '#4ADE80' },
  Cyber: { background: '#0A0A0A', surface: '#1F1F1F', accent: '#F000B8' },
  Lavender: { background: '#F5F3FF', surface: '#EDE9FE', accent: '#8B5CF6' },
  Sky: { background: '#E0F2FE', surface: '#BAE6FD', accent: '#0284C7' },
  Grape: { background: '#F3E8FF', surface: '#E9D5FF', accent: '#7C3AED' },
};


export default function DesignPanel({
  user,
  onUpdate,
  changesSaved,
}: {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
  changesSaved: (a: boolean) => void;
}) {
  const [design, setDesign] = useState(user.design || {});
  // ... (sections and visibility state remain the same) ...
  const initializeSections = () => {
    const savedOrder = user.design?.sections || [];
    const defaultOrder = ALL_SECTIONS.map(s => s.key);
    const validSaved = savedOrder.filter(key => defaultOrder.includes(key));
    const missing = defaultOrder.filter(key => !validSaved.includes(key));
    return [...validSaved, ...missing];
  };
  const [sections, setSections] = useState<string[]>(initializeSections());
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
    return ALL_SECTIONS.reduce((acc, s) => {
      acc[s.key] = user.design?.visibility?.[s.key] ?? true;
      return acc;
    }, {} as Record<string, boolean>);
  });


  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);


  useEffect(() => {
    onUpdate({ design: { ...design, sections, visibility } });
  }, [JSON.stringify(design), sections, JSON.stringify(visibility)]);

  const toggleVisibility = (sectionKey: string) => {
    setHasChanges(true);
    changesSaved(false);
    setVisibility(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleThemeClick = (name: string, colors: any) => {
    setHasChanges(true);
    changesSaved(false);
    setDesign({ ...design, theme: name.toLowerCase(), customColors: colors });
  };


  // --- UPDATED IMAGE REMOVAL FUNCTION ---
  const handleRemoveImage = async (type: 'header' | 'background') => {
    setDesign(prev => {
      const newDesign = { ...prev };
      delete newDesign[`${type}Image`];
      return newDesign;
    });
    onUpdate({
      design: { ...design, [`${type}Image`]: undefined }
    })

    toast.success('Image removed!');
    try {
      const res = await fetch('/api/profile/design-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete the image.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not remove image.');
    }
  };

  const handleSave = async () => {
    // ... (save logic remains the same)
    setIsSaving(true);
    const toastId = toast.loading('Saving design...');
    try {
      const payload = { ...design, sections, visibility };
      const res = await fetch('/api/profile/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');
      onUpdate({ design: payload });
      toast.success('Design Saved!', { id: toastId });
      setHasChanges(false);
      changesSaved(true);
    } catch (err) {
      toast.error('Could not save design.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const pinnedSection = ALL_SECTIONS.find(s => s.isPinned)!;
  const reorderableSections = sections.filter(key => key !== pinnedSection.key);

  return (
    <> {/* Use a fragment to wrap the dialog and the main content */}

      <div className="space-y-8 text-sm">
        {/* ... (h2 and color theme sections remain the same) ... */}
        <div>
          <h2 className="text-lg font-semibold">Design</h2>
          <p className="text-muted-foreground mt-1">Customize your public profile with images, colors, and layout.</p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Color Theme</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Object.entries(colorThemes).map(([name, colors]) => {
              const isSelected = design.theme === name.toLowerCase();
              return (
                <button key={name} onClick={() => handleThemeClick(name, colors)} className={`relative border rounded-md p-3 text-left group transition-all duration-300 h-[90px] ${isSelected ? 'border-blue-500 shadow-md ring-2 ring-blue-500' : 'border-gray-200 hover:border-gray-400'}`}>
                  <div className="relative h-6 w-6 mx-auto mt-1 flex justify-center">
                    <span className="absolute w-6 h-6 border border-gray-400 rounded-full transition-all duration-300 group-hover:translate-y-[-10px] group-hover:scale-110 z-10" style={{ background: colors.surface }} />
                    <span className="absolute w-6 h-6 border border-gray-400 rounded-full translate-y-[6px] transition-all duration-300 group-hover:translate-y-[0px] group-hover:scale-110 z-20" style={{ background: colors.background }} />
                    <span className="absolute w-6 h-6 border border-gray-400 rounded-full translate-y-[12px] transition-all duration-300 group-hover:translate-y-[10px] group-hover:scale-110 z-30" style={{ background: colors.accent }} />
                  </div>
                  <span className="block text-xs mt-6 text-center font-medium">{name}</span>
                </button>
              )
            })}
          </div>
          <CustomColorMenu design={design} setDesign={(cb: any) => {
            setDesign(cb)
            setHasChanges(true);
            changesSaved(false);
          }} />
        </div>


        {/* ... (Sections & Visibility section remains the same) ... */}
        <div>
          <h3 className="text-sm font-medium mb-2">Sections & Visibility</h3>
          <div className="space-y-2">
            <div className="bg-gray-100 flex justify-between items-center p-3 rounded-md border">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-gray-400" />
                <span className="font-bold text-gray-800">{pinnedSection.name}</span>
              </div>
              <button disabled className="text-gray-400 cursor-not-allowed flex items-center gap-1.5">
                <Eye size={16} />
                <span className="text-xs">(Always Visible)</span>
              </button>
            </div>

            <Reorder.Group axis="y" values={reorderableSections} onReorder={(newOrder) => {
              setHasChanges(true);
              changesSaved(false);
              setSections([pinnedSection.key, ...newOrder])
            }} className="space-y-2">
              {reorderableSections.map(key => {
                const sectionInfo = ALL_SECTIONS.find(s => s.key === key)!;
                const isProLocked = sectionInfo.pro && !user.isProUser;
                return (
                  <Reorder.Item key={key} value={key} className={`bg-white flex justify-between items-center p-3 rounded-md border ${isProLocked ? 'bg-gray-50 text-gray-400' : ''}`}>
                    <div className="flex items-center gap-3">
                      <GripVertical className={`h-5 w-5 ${isProLocked ? 'text-gray-300' : 'text-gray-500 cursor-grab'}`} />
                      <span className={`font-medium ${isProLocked ? '' : 'text-gray-700'}`}>{sectionInfo.name}</span>
                      {isProLocked && <Lock size={12} className="text-amber-500" />}
                    </div>
                    <button onClick={() => toggleVisibility(key)} disabled={isProLocked} className="text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed">
                      {visibility[key] ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        </div>

        <ImageUploadButtons
          design={design}
          onUploadComplete={(type, url) => {
            setDesign(prev => ({ ...prev, [`${type}Image`]: url }));
            onUpdate({ design: { ...design, [`${type}Image`]: url } });
            if (!url.includes("http")){
              setHasChanges(true);
              changesSaved(false);
            }
          }}
          handleRemoveImage={(type) => {
            handleRemoveImage(type); // Your own logic
          }}
          onDesignSettingsChange={(changes) => {
            setDesign((prev) => ({ ...prev, ...changes }))
            setHasChanges(true);
            changesSaved(false);
          }}
        />

        {/* ... (Save button remains the same) ... */}
        {hasChanges && (
          <div className="w-full relative">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Design'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}