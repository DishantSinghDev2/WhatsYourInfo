'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import {
  Users,
  Mail,
  Calendar,
  TrendingUp,
  Download,
  Eye,
  MessageSquare,
  Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Lead {
  _id: string;
  name: string;
  email: string;
  message: string;
  source: string;
  timestamp: string;
  status: 'new' | 'contacted' | 'converted';
}

export default function LeadsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        
        if (userData.user.isProUser) {
          fetchLeads(userData.user._id);
        }
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeads = async (userId: string) => {
    try {
      const response = await fetch(`/api/leads/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
        
        // Calculate stats
        const total = data.leads.length;
        const thisMonth = data.leads.filter((lead: Lead) => {
          const leadDate = new Date(lead.timestamp);
          const now = new Date();
          return leadDate.getMonth() === now.getMonth() && 
                 leadDate.getFullYear() === now.getFullYear();
        }).length;
        
        const converted = data.leads.filter((lead: Lead) => lead.status === 'converted').length;
        const conversionRate = total > 0 ? (converted / total) * 100 : 0;
        
        setStats({ total, thisMonth, conversionRate });
      }
    } catch (error) {
      toast.error('Failed to load leads');
    }
  };

  const exportLeads = () => {
    const csvContent = [
      ['Name', 'Email', 'Message', 'Source', 'Date', 'Status'],
      ...leads.map(lead => [
        lead.name,
        lead.email,
        lead.message,
        lead.source,
        new Date(lead.timestamp).toLocaleDateString(),
        lead.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Leads exported successfully!');
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
              <p className="text-gray-600 mb-4">Please sign in to access leads.</p>
              <Button onClick={() => router.push('/login')}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user.isProUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-6">
              <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Pro Feature</h2>
              <p className="text-gray-600 mb-4">Lead capture is available for Pro users only.</p>
              <Button onClick={() => router.push('/pricing')}>Upgrade to Pro</Button>
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
              <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
              <p className="text-gray-600">Track and manage leads from your profile</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={exportLeads}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Recent Leads
            </CardTitle>
            <CardDescription>
              Leads captured from your profile page
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
                <p className="text-gray-600 mb-4">
                  Leads will appear here when visitors contact you through your profile.
                </p>
                <Button variant="outline" onClick={() => router.push(`/${user.username}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Your Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead._id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{lead.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            lead.status === 'new' 
                              ? 'bg-blue-100 text-blue-800'
                              : lead.status === 'contacted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {lead.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {lead.email}
                          </div>
                          <div>
                            Source: {lead.source}
                          </div>
                          <div>
                            {new Date(lead.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        {lead.message && (
                          <p className="text-gray-700 text-sm bg-gray-100 p-3 rounded">
                            {lead.message}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}