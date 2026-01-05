"use client";
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Database, 
  Shield,
  LogOut,
  Server,
  Activity,
  AlertTriangle,
  Monitor,
  UserPlus,
  Key,
  FileText,
  BarChart3,
  MessageSquare,
  Clock,
  Plane
} from 'lucide-react';
import { logout } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';


type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
};

type ActiveView = 'dashboard' | 'users' | 'database' | 'settings' | 'security' | 'logs' | 'communications' | 'timesheets' | 'travel' | 'reports';

interface SysAdminDashboardProps {
  user: User;
}

export default function SysAdminDashboard({ user }: SysAdminDashboardProps) {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const result = await logout();
      if (result.success) {
        router.push('/');
      } else {
        console.error('Logout failed:', result.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  const adminMenuItems = [
    {
      id: 'users' as const,
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      color: 'bg-blue-500',
      subItems: [
        { icon: UserPlus, label: 'Add User' },
        { icon: Key, label: 'Permissions' },
        { icon: Activity, label: 'Activity' }
      ]
    },
    {
      id: 'database' as const,
      title: 'Database Management',
      description: 'Database operations and maintenance',
      icon: Database,
      color: 'bg-green-500',
      subItems: [
        { icon: Server, label: 'Backup' },
        { icon: Activity, label: 'Monitor' },
        { icon: Settings, label: 'Optimize' }
      ]
    },
    {
      id: 'settings' as const,
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: Settings,
      color: 'bg-purple-500',
      subItems: [
        { icon: Monitor, label: 'General' },
        { icon: Key, label: 'API Keys' },
        { icon: AlertTriangle, label: 'Alerts' }
      ]
    },
    {
      id: 'security' as const,
      title: 'Security Center',
      description: 'Security monitoring and management',
      icon: Shield,
      color: 'bg-red-500',
      subItems: [
        { icon: Shield, label: 'Policies' },
        { icon: AlertTriangle, label: 'Threats' },
        { icon: FileText, label: 'Audit' }
      ]
    },
    {
      id: 'logs' as const,
      title: 'System Logs',
      description: 'View and analyze system logs',
      icon: FileText,
      color: 'bg-yellow-500',
      subItems: [
        { icon: Activity, label: 'Live Logs' },
        { icon: AlertTriangle, label: 'Errors' },
        { icon: BarChart3, label: 'Analytics' }
      ]
    }
  ];

  const businessMenuItems = [
    {
      id: 'reports' as const,
      title: 'Reports & Analytics',
      description: 'Comprehensive system reports',
      icon: BarChart3,
      color: 'bg-indigo-500'
    },
    {
      id: 'communications' as const,
      title: 'Communications',
      description: 'Global communication management',
      icon: MessageSquare,
      color: 'bg-cyan-500'
    },
    {
      id: 'timesheets' as const,
      title: 'Timesheets',
      description: 'All timesheet management',
      icon: Clock,
      color: 'bg-emerald-500'
    },
    {
      id: 'travel' as const,
      title: 'Travel Forms',
      description: 'Travel request management',
      icon: Plane,
      color: 'bg-orange-500'
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <div>user</div>;
      case 'database':
        return <div>database</div>;
      case 'settings':
        return <div>settings</div>;
      case 'security':
        return <div>security</div>;
      case 'logs':
        return <div>logs</div>;
      case 'communications':
        return <div>communications</div>;
      case 'timesheets':
        return <div>timesheets</div>;
      case 'travel':
        return <div>travel</div>;
      case 'reports':
        return <div>reports</div>;
      default:
        return (
          <div className="space-y-6">
            {/* System Health Dashboard */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <div className="flex items-center">
                  <Server className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">System Status</p>
                    <p className="text-lg font-bold text-green-600">Online</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">47</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">DB Health</p>
                    <p className="text-lg font-bold text-green-600">Excellent</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Admin Functions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Administration</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {adminMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                      <div 
                        onClick={() => setActiveView(item.id)}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-lg ${item.color} text-white group-hover:scale-110 transition-transform`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.subItems.map((subItem, index) => {
                            const SubIcon = subItem.icon;
                            return (
                              <div key={index} className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                <SubIcon className="h-3 w-3" />
                                <span>{subItem.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Business Functions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Functions</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {businessMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                      <div 
                        onClick={() => setActiveView(item.id)}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-lg ${item.color} text-white group-hover:scale-110 transition-transform`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* System Alerts */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Events</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Database backup completed with warnings</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">Warning</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded border-l-4 border-green-400">
                  <div className="flex items-center space-x-3">
                    <Server className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">System performance optimized</p>
                      <p className="text-xs text-gray-500">6 hours ago</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Success</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">3 new users added to system</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500">Info</Badge>
                </div>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Welcome Banner */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    System Administration
                  </h1>
                  <p className="text-sm text-gray-600">
                    Welcome {user.first_name} • Administrator Portal
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-900 font-medium">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {activeView !== 'dashboard' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('dashboard')}
                className="text-red-600 hover:text-red-800"
              >
                ← Back to Dashboard
              </Button>
              <div className="text-sm text-gray-500">
                {[...adminMenuItems, ...businessMenuItems].find(item => item.id === activeView)?.title}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}