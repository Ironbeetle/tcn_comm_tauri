"use client";
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  User,
  LogOut,
  Mail,
  Send,
  Bell
} from 'lucide-react';
import { logout } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';
import Communications from './Communications';

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
};

type ActiveView = 'dashboard' | 'communications';

interface StaffDashboardProps {
  user: User;
}

export default function StaffDashboard({ user }: StaffDashboardProps) {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: 'communications' as const,
      title: 'Communications',
      description: 'Send SMS, emails, and notifications',
      icon: MessageSquare,
      color: 'bg-blue-500',
      subItems: [
        { icon: Send, label: 'SMS' },
        { icon: Mail, label: 'Email' },
        { icon: Bell, label: 'Notifications' }
      ]
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'communications':
        return <Communications user={user} />;
      default:
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => {
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
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user.first_name}, {user.last_name}!
                  </h1>
                  <p className="text-sm text-gray-600">
                    {user.department} Department • Staff Portal
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
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Dashboard
              </Button>
              <div className="text-sm text-gray-500">
                {menuItems.find(item => item.id === activeView)?.title}
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