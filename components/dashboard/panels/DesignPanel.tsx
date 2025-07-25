'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { UserProfile } from '@/types';

const colorThemes = {
  Classic: { background: '#FFFFFF', surface: '#F8F9FA', accent: '#007BFF' },
  Sunset: { background: '#2C3E50', surface: '#34495E', accent: '#E74C3C' },
  Mint: { background: '#F0FFF4', surface: '#FFFFFF', accent: '#38A169' },
  // New Themes
  Nite: { background: '#111827', surface: '#1F2937', accent: '#3B82F6'},
  Solar: { background: '#FDF6E3', surface: '#FBF1D5', accent: '#B58900'},
  Rose: { background: '#FFF1F2', surface: '#FFFFFF', accent: '#DB2777'},
  Forest: { background: '#1A2A27', surface: '#2D423F', accent: '#4ADE80'},
  Cyber: { background: '#000000', surface: '#1A1A1A', accent: '#F000B8'},

};

interface DesignPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export default function DesignPanel({ user, onUpdate }: DesignPanelProps) {
  const [design, setDesign] = useState(user.design || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving design...');
    try {
      const response = await fetch('/api/profile/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(design),
      });

      if (!response.ok) throw new Error('Failed to save design');

      onUpdate({ design }); // Update parent state for live preview
      toast.success('Design updated!', { id: toastId });
    } catch (error) {
      toast.error(error.message || 'Could not save design.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Design</h1>
      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {Object.entries(colorThemes).map(([name, colors]) => (
              <button
                key={name}
                onClick={() => setDesign(prev => ({ ...prev, theme: name.toLowerCase(), customColors: colors }))}
                className="text-center"
              >
                <div 
                  className="h-16 w-full rounded-lg border-2 flex items-center justify-center"
                  style={{ 
                    backgroundColor: colors.surface, 
                    borderColor: design.theme === name.toLowerCase() ? colors.accent : 'transparent'
                  }}
                >
                  <div className="h-6 w-6 rounded-full" style={{ backgroundColor: colors.accent }}></div>
                </div>
                <p className="text-sm mt-2">{name}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Add Cards for Header Image, Background Image, and Section Reordering */}
      
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Design'}
        </Button>
      </div>
    </div>
  );
}