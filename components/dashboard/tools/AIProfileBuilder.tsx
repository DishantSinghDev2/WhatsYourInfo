'use client';

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

export default function AIProfileBuilder({ user }: { user: any }) {
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Professional');
  const [generatedBio, setGeneratedBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!keywords) {
      toast.error('Please enter some keywords.');
      return;
    }
    setIsLoading(true);
    setGeneratedBio('');
    try {
      const res = await fetch('/api/tools/ai-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: user.firstName, keywords, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedBio(data.bio);
    } catch {
      toast.error('Failed to generate bio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-bold">AI Profile Builder</h2>
        <Input 
            placeholder="Enter keywords (e.g., 'React developer, data science, project manager')"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
        />
        <Select onValueChange={setTone} defaultValue={tone}>
            <SelectTrigger><SelectValue placeholder="Select a tone" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Witty">Witty</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
            </SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={isLoading}>{isLoading ? 'Generating...' : 'Generate Bio'}</Button>
        {generatedBio && (
            <div>
                <Textarea value={generatedBio} rows={6} readOnly />
                <Button variant="outline" className="mt-2" onClick={() => {
                    navigator.clipboard.writeText(generatedBio);
                    toast.success('Bio copied to clipboard!');
                }}>Copy Bio</Button>
            </div>
        )}
    </div>
  );
}