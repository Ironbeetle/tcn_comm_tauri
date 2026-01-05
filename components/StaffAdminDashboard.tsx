"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  LogOut
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

interface StaffAdminDashboardProps {
  user: User;
}

export default function StaffAdminDashboard({ user }: StaffAdminDashboardProps) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    TCN Messenger
                  </h1>
                  <p className="text-sm text-gray-600">
                    Staff Admin • {user.first_name} {user.last_name}
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

      {/* Main Content - Communications */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Communications user={{
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          department: user.department
        }} />
      </div>
    </div>
  );
}
