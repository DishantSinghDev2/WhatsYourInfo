'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import {
  User,
  Settings,
  BarChart3,
  ExternalLink,
  Edit,
  Save,
  X,
  Globe,
  Mail,
  Twitter,
  Linkedin,
  Github,
  Sparkles,
  Crown,
  Eye,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generateBio } from '@/lib/gemini';

interface UserProfile {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: string;
  isProUser: boolean;
  customDomain?: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  spotlightButton?: {
    text: string;
    url: string;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      github: '',
      website: '',
    },
    spotlightButton: {
      text: '',
      url: '',
      color: '#3B82F6',
    },
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/user', {
  credentials: 'include',
});

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setFormData({
          firstName: userData.user.firstName,
          lastName: userData.user.lastName,
          bio: userData.user.bio || '',
          socialLinks: userData.user.socialLinks || {
            twitter: '',
            linkedin: '',
            github: '',
            website: '',
          },
          spotlightButton: userData.user.spotlightButton || {
            text: '',
            url: '',
            color: '#3B82F6',
          },
        });
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser.user);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBio = async () => {
    if (!user) return;
    
    setIsGeneratingBio(true);
    try {
      const generatedBio = await generateBio({
        firstName: formData.firstName,
        lastName: formData.lastName,
        profession: 'Professional', // Could be enhanced with a profession field
        interests: [], // Could be enhanced with interests
        experience: 'Experienced professional',
      });
      
      setFormData(prev => ({ ...prev, bio: generatedBio }));
      toast.success('Bio generated successfully!');
    } catch (error) {
      toast.error('Failed to generate bio. Please try again.');
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-6">
              <p className="text-gray-600 mb-4">Please sign in to access your dashboard.</p>
              <Button onClick={() => router.push('/login')}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Manage your profile and settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href={`/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </a>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
              <Button variant="outline" onClick={() => router.push('/analytics')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              {user.isProUser && (
                <Button variant="outline" onClick={() => router.push('/leads')}>
                  <Users className="h-4 w-4 mr-2" />
                  Leads
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your public profile information
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    ) : (
                      <p className="text-gray-900">{user.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    ) : (
                      <p className="text-gray-900">{user.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateBio}
                        disabled={isGeneratingBio}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        {isGeneratingBio ? 'Generating...' : 'AI Generate'}
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell people about yourself..."
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {user.bio || 'No bio added yet.'}
                    </p>
                  )}
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Social Links
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Twitter className="h-5 w-5 text-blue-400" />
                      {isEditing ? (
                        <Input
                          placeholder="https://twitter.com/username"
                          value={formData.socialLinks.twitter}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                          }))}
                        />
                      ) : (
                        <span className="text-gray-900">
                          {user.socialLinks?.twitter || 'Not set'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Linkedin className="h-5 w-5 text-blue-600" />
                      {isEditing ? (
                        <Input
                          placeholder="https://linkedin.com/in/username"
                          value={formData.socialLinks.linkedin}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                          }))}
                        />
                      ) : (
                        <span className="text-gray-900">
                          {user.socialLinks?.linkedin || 'Not set'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Github className="h-5 w-5 text-gray-800" />
                      {isEditing ? (
                        <Input
                          placeholder="https://github.com/username"
                          value={formData.socialLinks.github}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, github: e.target.value }
                          }))}
                        />
                      ) : (
                        <span className="text-gray-900">
                          {user.socialLinks?.github || 'Not set'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-green-600" />
                      {isEditing ? (
                        <Input
                          placeholder="https://yourwebsite.com"
                          value={formData.socialLinks.website}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, website: e.target.value }
                          }))}
                        />
                      ) : (
                        <span className="text-gray-900">
                          {user.socialLinks?.website || 'Not set'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pro Features */}
                {user.isProUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Spotlight Button (Pro Feature)
                    </label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Button Text</label>
                          {isEditing ? (
                            <Input
                              placeholder="Contact Me"
                              value={formData.spotlightButton.text}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                spotlightButton: { ...prev.spotlightButton, text: e.target.value }
                              }))}
                            />
                          ) : (
                            <span className="text-gray-900">
                              {user.spotlightButton?.text || 'Not set'}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Button Color</label>
                          {isEditing ? (
                            <input
                              type="color"
                              value={formData.spotlightButton.color}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                spotlightButton: { ...prev.spotlightButton, color: e.target.value }
                              }))}
                              className="w-full h-9 border border-gray-300 rounded-lg"
                            />
                          ) : (
                            <div
                              className="w-full h-6 rounded border"
                              style={{ backgroundColor: user.spotlightButton?.color || '#3B82F6' }}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Button URL</label>
                        {isEditing ? (
                          <Input
                            placeholder="https://calendly.com/username"
                            value={formData.spotlightButton.url}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              spotlightButton: { ...prev.spotlightButton, url: e.target.value }
                            }))}
                          />
                        ) : (
                          <span className="text-gray-900">
                            {user.spotlightButton?.url || 'Not set'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {user.isProUser ? (
                    <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                  ) : (
                    <User className="h-5 w-5 mr-2" />
                  )}
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Plan:</span>
                    <span className={`text-sm font-medium ${user.isProUser ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {user.isProUser ? 'Pro' : 'Free'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Username:</span>
                    <span className="text-sm font-medium text-gray-900">@{user.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Profile URL:</span>
                    <a
                      href={`/${user.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      View <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                  {!user.isProUser && (
                    <div className="pt-3 border-t">
                      <Button className="w-full" onClick={() => router.push('/pricing')}>
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Profile Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Profile Views:</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/analytics')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View Analytics
                    </Button>
                  </div>
                  {user.isProUser && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Leads:</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push('/leads')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Manage Leads
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Signature:</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/tools/email-signature')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile URLs */}
            <Card>
              <CardHeader>
                <CardTitle>Your Profile URLs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Primary URL:</p>
                    <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                      https://whatsyour.info/{user.username}
                    </code>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Subdomain URL:</p>
                    <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                      https://{user.username}.whatsyour.info
                    </code>
                  </div>
                  {user.customDomain && (
                    <div>
                      <p className="text-gray-600 mb-1">Custom Domain:</p>
                      <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                        https://{user.customDomain}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}