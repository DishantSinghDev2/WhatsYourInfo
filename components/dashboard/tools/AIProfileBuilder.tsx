'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { UserProfile } from '@/types';

export default function AIProfileBuilder({ user, onUpdate }: { user: UserProfile, onUpdate: ({}) => void }) {
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Professional');
  const [detail, setDetail] = useState('Medium');
  const [humor, setHumor] = useState('None');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!keywords) return toast.error('Please enter some keywords.');
    setIsLoading(true);
    try {
      const res = await fetch('/api/tools/ai-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: user.firstName, keywords, tone, detail, humor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate({ bio: data.bio });
      toast.success("Bio updated")
    } catch {
      toast.error('Failed to generate bio.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGroup = (
    title: string,
    options: string[],
    selected: string,
    onSelect: (val: string) => void
  ) => (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex gap-2 bg-muted/10 px-3 py-2 rounded-md relative ">
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <div key={option} className="relative w-full">
              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.div
                    layoutId={`selection-${title}`}
                    className="absolute inset-0 rounded-md bg-blue-600/10 border border-blue-600"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </AnimatePresence>
              <button
                onClick={() => onSelect(option)}
                className={`relative z-10 text-sm px-3 py-1.5 rounded-md transition-colors ${
                  isSelected
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-muted/30'
                }`}
              >
                {option}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">AI Profile Builder</h2>

      <div>
        <label className="text-sm font-medium">Who are you?</label>
        <Input
          placeholder="e.g. React developer, gamer, productivity geek"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
      </div>

      {renderGroup('Tone', ['Professional', 'Friendly', 'Witty'], tone, setTone)}
      {renderGroup('Detail Level', ['Low', 'Medium', 'High'], detail, setDetail)}
      {renderGroup('Humor', ['None', 'Subtle', 'Full-on'], humor, setHumor)}

      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Bio'}
      </Button>
    </div>
  );
}
