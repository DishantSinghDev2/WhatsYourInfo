'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Header from '@/components/Header';
import {
  BarChart3,
  Eye,
  TrendingUp,
  Globe,
  Calendar,
  Users,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { User } from '@/lib/auth';

interface AnalyticsData {
  totalViews: number;
  todayViews: number;
  viewsByDay: Array<{ date: string; views: number }>;
  referrerStats: Array<{ referrer: string; count: number }>;
  recentViews: Array<{
    timestamp: string;
    referrer: string;
    userAgent: string;
  }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        fetchAnalytics(userData.user.username);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async (username: string) => {
    try {
      const response = await fetch(`/api/analytics/stats/${username}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to load analytics');
      }
    } catch {
      toast.error('Failed to load analytics');
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
              <p className="text-gray-600 mb-4">Please sign in to view analytics.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">Track your profile performance and visitor insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push(`/${user.username}`)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Profile
              </Button>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {analytics ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Eye className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Today's Views</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.todayViews}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">30-Day Average</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(analytics.viewsByDay.reduce((sum, day) => sum + day.views, 0) / 30)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Views Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Views Over Time
                  </CardTitle>
                  <CardDescription>
                    Daily profile views for the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.viewsByDay.slice(-7).map((day, index) => (
                      <div key={day.date || index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="bg-blue-200 h-2 rounded"
                            style={{ 
                              width: `${Math.max(day.views / Math.max(...analytics.viewsByDay.map(d => d.views)) * 100, 5)}px`,
                              minWidth: '20px'
                            }}
                          />
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">
                            {day.views}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Referrers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Top Referrers
                  </CardTitle>
                  <CardDescription>
                    Where your visitors are coming from
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.referrerStats.slice(0, 8).map((referrer, index) => (
                      <div key={referrer.referrer || index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          <span className="text-sm text-gray-900 truncate max-w-[200px]">
                            {referrer.referrer === 'direct' ? 'Direct' : referrer.referrer}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="bg-blue-100 h-2 rounded"
                            style={{ 
                              width: `${Math.max(referrer.count / Math.max(...analytics.referrerStats.map(r => r.count)) * 60, 10)}px`
                            }}
                          />
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">
                            {referrer.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest profile views and visitor information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.recentViews.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent views to display</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.recentViews.map((view, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <div>
                            <p className="text-sm text-gray-900">
                              Profile viewed
                            </p>
                            <p className="text-xs text-gray-500">
                              From: {view.referrer === 'direct' ? 'Direct' : view.referrer}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(view.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(view.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data yet</h3>
            <p className="text-gray-600 mb-4">
              Analytics will appear here once people start viewing your profile.
            </p>
            <Button variant="outline" onClick={() => router.push(`/${user.username}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View Your Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}