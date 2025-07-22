'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Mail,
  Copy,
  Download,
  Eye,
  Settings,
  Palette,
  Type,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SignatureData {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  profileUrl: string;
  logoUrl: string;
  template: 'modern' | 'classic' | 'minimal' | 'creative';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  includePhoto: boolean;
  includeSocial: boolean;
}

const templates = [
  { id: 'modern', name: 'Modern', description: 'Clean and contemporary design' },
  { id: 'classic', name: 'Classic', description: 'Traditional professional look' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
  { id: 'creative', name: 'Creative', description: 'Bold and eye-catching' },
];

const colorOptions = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#6B7280', '#1F2937', '#059669'
];

export default function EmailSignaturePage() {
  const [signatureData, setSignatureData] = useState<SignatureData>({
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    profileUrl: '',
    logoUrl: '',
    template: 'modern',
    primaryColor: '#3B82F6',
    fontSize: 'medium',
    includePhoto: true,
    includeSocial: true,
  });

  const [previewMode, setPreviewMode] = useState<'html' | 'plain'>('html');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Try to load user data if logged in
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        
        // Pre-fill form with user data
        setSignatureData(prev => ({
          ...prev,
          name: `${userData.user.firstName} ${userData.user.lastName}`,
          email: userData.user.email,
          profileUrl: `https://whatsyour.info/${userData.user.username}`,
          website: userData.user.socialLinks?.website || '',
        }));
      }
    } catch (error) {
      // User not logged in, continue with empty form
    }
  };

  const generateSignatureHTML = () => {
    const { name, title, company, email, phone, website, profileUrl, logoUrl, primaryColor, fontSize } = signatureData;
    
    const fontSizeMap = {
      small: '12px',
      medium: '14px',
      large: '16px'
    };

    const currentFontSize = fontSizeMap[fontSize];

    if (signatureData.template === 'modern') {
      return `
        <div style="font-family: Arial, sans-serif; font-size: ${currentFontSize}; line-height: 1.4; color: #333;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right: 20px; vertical-align: top;">
                ${signatureData.includePhoto && user ? `
                  <img src="https://www.gravatar.com/avatar/${btoa(user.email)}?s=80&d=identicon" 
                       alt="${name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
                ` : ''}
              </td>
              <td style="vertical-align: top;">
                <div style="font-weight: bold; font-size: ${parseInt(currentFontSize) + 2}px; color: ${primaryColor};">
                  ${name}
                </div>
                ${title ? `<div style="color: #666; margin: 2px 0;">${title}</div>` : ''}
                ${company ? `<div style="color: #666; margin: 2px 0;">${company}</div>` : ''}
                <div style="margin: 8px 0;">
                  ${email ? `<div><a href="mailto:${email}" style="color: ${primaryColor}; text-decoration: none;">${email}</a></div>` : ''}
                  ${phone ? `<div style="color: #666;">${phone}</div>` : ''}
                  ${website ? `<div><a href="${website}" style="color: ${primaryColor}; text-decoration: none;">${website}</a></div>` : ''}
                </div>
                ${profileUrl ? `
                  <div style="margin-top: 10px;">
                    <a href="${profileUrl}" style="background-color: ${primaryColor}; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px;">
                      View My Profile
                    </a>
                  </div>
                ` : ''}
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    // Add other template variations here
    return generateSignatureHTML();
  };

  const generatePlainText = () => {
    const { name, title, company, email, phone, website, profileUrl } = signatureData;
    
    let signature = `${name}\n`;
    if (title) signature += `${title}\n`;
    if (company) signature += `${company}\n`;
    signature += '\n';
    if (email) signature += `Email: ${email}\n`;
    if (phone) signature += `Phone: ${phone}\n`;
    if (website) signature += `Website: ${website}\n`;
    if (profileUrl) signature += `Profile: ${profileUrl}\n`;
    
    return signature;
  };

  const copyToClipboard = () => {
    const content = previewMode === 'html' ? generateSignatureHTML() : generatePlainText();
    
    if (previewMode === 'html') {
      // For HTML, we need to copy both HTML and plain text versions
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([content], { type: 'text/html' }),
        'text/plain': new Blob([generatePlainText()], { type: 'text/plain' })
      });
      
      navigator.clipboard.write([clipboardItem]).then(() => {
        toast.success('Signature copied to clipboard!');
      }).catch(() => {
        // Fallback to plain text
        navigator.clipboard.writeText(generatePlainText());
        toast.success('Signature copied as plain text!');
      });
    } else {
      navigator.clipboard.writeText(content);
      toast.success('Signature copied to clipboard!');
    }
  };

  const downloadSignature = () => {
    const content = previewMode === 'html' ? generateSignatureHTML() : generatePlainText();
    const blob = new Blob([content], { type: previewMode === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-signature.${previewMode === 'html' ? 'html' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Signature downloaded!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Signature Generator</h1>
          <p className="text-gray-600 mt-2">Create professional email signatures in minutes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Signature Details
                </CardTitle>
                <CardDescription>
                  Fill in your information to generate your signature
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      value={signatureData.name}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <Input
                      value={signatureData.title}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <Input
                    value={signatureData.company}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={signatureData.email}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input
                      value={signatureData.phone}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <Input
                    value={signatureData.website}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile URL
                  </label>
                  <Input
                    value={signatureData.profileUrl}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, profileUrl: e.target.value }))}
                    placeholder="https://whatsyour.info/username"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Design Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Design Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSignatureData(prev => ({ ...prev, template: template.id as any }))}
                        className={`p-3 text-left border rounded-lg transition-colors ${
                          signatureData.template === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex space-x-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSignatureData(prev => ({ ...prev, primaryColor: color }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          signatureData.primaryColor === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <div className="flex space-x-2">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSignatureData(prev => ({ ...prev, fontSize: size as any }))}
                        className={`px-3 py-1 text-sm border rounded ${
                          signatureData.fontSize === size
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={signatureData.includePhoto}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, includePhoto: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Include profile photo</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={signatureData.includeSocial}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, includeSocial: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Include social links</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Preview
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewMode('html')}
                      className={`px-3 py-1 text-sm border rounded ${
                        previewMode === 'html'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      HTML
                    </button>
                    <button
                      onClick={() => setPreviewMode('plain')}
                      className={`px-3 py-1 text-sm border rounded ${
                        previewMode === 'plain'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Plain Text
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white min-h-[200px]">
                  {previewMode === 'html' ? (
                    <div dangerouslySetInnerHTML={{ __html: generateSignatureHTML() }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {generatePlainText()}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Export Signature</CardTitle>
                <CardDescription>
                  Copy or download your signature to use in your email client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button onClick={copyToClipboard} className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" onClick={downloadSignature} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Copy your signature using the button above</li>
                    <li>2. Open your email client settings</li>
                    <li>3. Find the signature section</li>
                    <li>4. Paste your signature and save</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}