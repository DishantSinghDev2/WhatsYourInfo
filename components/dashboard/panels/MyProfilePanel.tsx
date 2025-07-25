'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { SiX, SiLinkedin, SiGithub } from 'react-icons/si';
import { Globe, Sparkles, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserProfile } from '@/types';
import { generateBio } from '@/lib/gemini'; // Assuming this utility exists

interface MyProfilePanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export default function MyProfilePanel({ user, onUpdate }: MyProfilePanelProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    bio: user.bio || '',
    socialLinks: user.socialLinks || { twitter: '', linkedin: '', github: '', website: '' },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // Update form data and live preview simultaneously
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    if (keys.length > 1) {
      // Handle nested state like socialLinks.twitter
      setFormData(prev => {
        const newState = { ...prev };
        let current: any = newState;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        onUpdate(newState); // Update live preview
        return newState;
      });
    } else {
      setFormData(prev => {
        const newState = { ...prev, [name]: value };
        onUpdate(newState); // Update live preview
        return newState;
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving profile...');
    try {
      const response = await fetch('/api/profile/details', { // New API endpoint
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }
      
      toast.success('Profile updated!', { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save profile.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    toast.loading('Generating AI bio...', { id: 'bio-gen' });
    try {
      const bio = await generateBio({formData});
      setFormData(prev => {
        const newState = { ...prev, bio };
        onUpdate(newState);
        return newState;
      });
      toast.success('Bio generated!', { id: 'bio-gen' });
    } catch (error) {
      toast.error('Failed to generate bio.', { id: 'bio-gen' });
    } finally {
      setIsGeneratingBio(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-gray-500">This information will be displayed publicly on your profile.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Name</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" />
          <Input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bio</CardTitle>
            <Button variant="outline" size="sm" onClick={handleGenerateBio} disabled={isGeneratingBio}>
              <Sparkles className={`h-4 w-4 mr-2 ${isGeneratingBio ? 'animate-spin' : ''}`} />
              AI Generate
            </Button>
          </div>
          <CardDescription>
            Write a short bio about yourself. It supports Markdown for rich text formatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={6}
            placeholder="Frontend developer, coffee enthusiast, and lifelong learner..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Add links to your social media profiles and website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <SiX className="h-6 w-6 text-[#1DA1F2]" />
            <Input name="socialLinks.twitter" value={formData.socialLinks.twitter} onChange={handleChange} placeholder="https://twitter.com/username" />
          </div>
          <div className="flex items-center gap-3">
            <SiLinkedin className="h-6 w-6 text-[#0A66C2]" />
            <Input name="socialLinks.linkedin" value={formData.socialLinks.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
          </div>
          <div className="flex items-center gap-3">
            <SiGithub className="h-6 w-6 text-black" />
            <Input name="socialLinks.github" value={formData.socialLinks.github} onChange={handleChange} placeholder="https://github.com/username" />
          </div>
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-green-600" />
            <Input name="socialLinks.website" value={formData.socialLinks.website} onChange={handleChange} placeholder="https://your-website.com" />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end sticky bottom-0 bg-white py-4">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}