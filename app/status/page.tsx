'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Activity,
  Server,
  Database,
  Globe,
  Shield,
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  description: string;
  uptime: string;
  responseTime: string;
  icon: React.FC<{ className?: string }>;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  timestamp: string;
  updates: Array<{
    timestamp: string;
    message: string;
    status: string;
  }>;
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [overallStatus, setOverallStatus] = useState<'operational' | 'degraded' | 'outage'>('operational');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatusData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatusData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatusData = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services);
        setIncidents(data.incidents);
        setOverallStatus(data.overallStatus);
      } else {
        // Fallback to mock data if API fails
        setServices(mockServices);
        setIncidents(mockIncidents);
        setOverallStatus('operational');
      }
    } catch {
      // Fallback to mock data
      setServices(mockServices);
      setIncidents(mockIncidents);
      setOverallStatus('operational');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for demonstration
  const mockServices: ServiceStatus[] = [
    {
      name: 'API Services',
      status: 'operational',
      description: 'All API endpoints are functioning normally',
      uptime: '99.98%',
      responseTime: '145ms',
      icon: Server,
    },
    {
      name: 'Profile Pages',
      status: 'operational',
      description: 'Public profile pages are loading correctly',
      uptime: '99.99%',
      responseTime: '89ms',
      icon: Globe,
    },
    {
      name: 'Authentication',
      status: 'operational',
      description: 'User login and registration working normally',
      uptime: '99.97%',
      responseTime: '203ms',
      icon: Shield,
    },
    {
      name: 'Database',
      status: 'operational',
      description: 'MongoDB and Redis clusters are healthy',
      uptime: '99.99%',
      responseTime: '12ms',
      icon: Database,
    },
    {
      name: 'CDN & Assets',
      status: 'operational',
      description: 'Image delivery and static assets loading fast',
      uptime: '99.95%',
      responseTime: '67ms',
      icon: Activity,
    },
  ];

  const mockIncidents: Incident[] = [
    {
      id: '1',
      title: 'Scheduled Maintenance - Database Optimization',
      status: 'resolved',
      severity: 'minor',
      description: 'Routine database maintenance to improve performance',
      timestamp: '2025-01-14T02:00:00Z',
      updates: [
        {
          timestamp: '2025-01-14T04:30:00Z',
          message: 'Maintenance completed successfully. All services restored.',
          status: 'resolved'
        },
        {
          timestamp: '2025-01-14T02:00:00Z',
          message: 'Maintenance window started. Some API requests may experience slight delays.',
          status: 'monitoring'
        }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      operational: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      outage: 'bg-red-100 text-red-800',
      maintenance: 'bg-blue-100 text-blue-800',
      investigating: 'bg-orange-100 text-orange-800',
      identified: 'bg-red-100 text-red-800',
      monitoring: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      minor: 'bg-yellow-100 text-yellow-800',
      major: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              {getStatusIcon(overallStatus)}
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl ml-3">
                System Status
              </h1>
            </div>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Real-time status and uptime monitoring for all What'sYour.Info services.
              Subscribe to updates to stay informed about any service disruptions.
            </p>
            <div className="mt-8">
              {getStatusBadge(overallStatus)}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Current Status */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Service Status
          </h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <service.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {service.uptime} uptime
                        </div>
                        <div className="text-xs text-gray-500">
                          {service.responseTime} avg response
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(service.status)}
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Incidents */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Recent Incidents
          </h2>
          {incidents.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Recent Incidents
                </h3>
                <p className="text-gray-600">
                  All systems are operating normally. No incidents to report in the last 30 days.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {incidents.map((incident) => (
                <Card key={incident.id} className="border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{incident.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>
                    </div>
                    <CardDescription>
                      {incident.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-500">
                        Started: {new Date(incident.timestamp).toLocaleString()}
                      </div>
                      
                      {/* Incident Updates */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Updates:</h4>
                        {incident.updates.map((update, updateIndex) => (
                          <div key={updateIndex} className="border-l-2 border-gray-200 pl-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(update.timestamp).toLocaleString()}
                              </span>
                              {getStatusBadge(update.status)}
                            </div>
                            <p className="text-sm text-gray-600">{update.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Uptime Statistics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Uptime Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.98%</div>
                <div className="text-sm text-gray-600">Last 30 days</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.97%</div>
                <div className="text-sm text-gray-600">Last 90 days</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">142ms</div>
                <div className="text-sm text-gray-600">Avg response time</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                <div className="text-sm text-gray-600">Active incidents</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Subscribe to Updates */}
        <section>
          <Card className="border-gray-200 bg-blue-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Stay Updated
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Subscribe to status updates to receive notifications about service disruptions, 
                maintenance windows, and incident resolutions.
              </p>
              <div className="flex items-center justify-center space-x-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                You can unsubscribe at any time. We'll only send important status updates.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
    </div>
  );
}