// components/AIProfileBuilder.tsx

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { UserProfile } from '@/types';
import { Sparkles, Save, Crown, Loader2 } from 'lucide-react';

export default function AIProfileBuilder({ user, onUpdate }: { user: UserProfile, onUpdate: (data: Partial<UserProfile>) => void }) {
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Professional');
  const [detail, setDetail] = useState('Medium');
  const [humor, setHumor] = useState('None');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- NEW STATE for the generated bio and saving process ---
  const [generatedBio, setGeneratedBio] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Pro-only Feature Gate ---
  if (!user?.isProUser) {
    return (
        <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200 text-center">
            <Crown className="h-8 w-8 mx-auto text-yellow-500 mb-2"/>
            <p className="font-semibold text-yellow-800">This is a Pro-only feature.</p>
            <p className="text-sm text-yellow-700">Upgrade your plan to generate your bio with AI.</p>
        </div>
    );
  }

  const handleGenerate = async () => {
    if (!keywords) return toast.error('Please enter some keywords about yourself.');
    setIsGenerating(true);
    setGeneratedBio(null); // Clear previous generation
    try {
      const res = await fetch('/api/tools/ai-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: user.firstName, keywords, tone, detail, humor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Update local state, DO NOT call onUpdate yet
      setGeneratedBio(data.bio);
      toast.success("AI bio generated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate bio.');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- NEW: Function to save the generated bio to the user's profile ---
  const handleSaveBio = async () => {
    if (!generatedBio) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: generatedBio }), // Send only the bio for a partial update
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Now, call the onUpdate prop to refresh the parent component's UI
      onUpdate({ bio: generatedBio });
      toast.success("Your bio has been saved!");
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save bio.');
    } finally {
        setIsSaving(false);
    }
  }

  const renderGroup = (
    title: string,
    options: string[],
    selected: string,
    onSelect: (val: string) => void
  ) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={selected === option ? 'default' : 'outline'}
            onClick={() => onSelect(option)}
            size="sm"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-5 border rounded-lg">
      <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue-500" /> AI Profile Builder</h2>

      <div>
        <label className="text-sm font-medium">Describe yourself in a few keywords</label>
        <p className="text-xs text-gray-500 mb-1">Enter skills, hobbies, or personality traits.</p>
        <Input
          placeholder="e.g., Senior React developer, avid hiker, productivity geek"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
      </div>

      {renderGroup('Tone', ['Professional', 'Friendly', 'Witty'], tone, setTone)}
      {renderGroup('Detail Level', ['Low', 'Medium', 'High'], detail, setDetail)}
      {renderGroup('Humor', ['None', 'Subtle', 'Witty'], humor, setHumor)}

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full sm:w-auto">
        {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        {isGenerating ? 'Generating...' : 'Generate Bio'}
      </Button>

      <AnimatePresence>
        {generatedBio && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 pt-6 border-t"
          >
            <h3 className="font-semibold">Your Generated Bio:</h3>
            <textarea
              value={generatedBio}
              onChange={(e) => setGeneratedBio(e.target.value)}
              className="w-full p-3 border rounded-md bg-gray-50 min-h-[150px]"
            />
            <Button onClick={handleSaveBio} disabled={isSaving}>
               {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
               {isSaving ? 'Saving...' : 'Save Bio to Profile'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}