"use client"

import { useState, useEffect } from 'react'
import { 
  Users, Mail, MessageSquare, FileText, ClipboardList, 
  TrendingUp, TrendingDown, Activity, Calendar
} from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { toast } from 'sonner'

interface DashboardStats {
  overview: {
    totalUsers: number
    totalEmails: number
    emailsLast30Days: number
    totalSms: number
    smsLast30Days: number
    totalBulletins: number
    bulletinsLast30Days: number
    totalForms: number
    totalSubmissions: number
    recentLogins: number
  }
  usersByRole: { role: string; count: number }[]
  usersByDepartment: { department: string; count: number }[]
  charts: {
    emails: { date: string; count: number }[]
    sms: { date: string; count: number }[]
    logins: { date: string; count: number }[]
  }
  recentActivity: {
    emails: any[]
    sms: any[]
  }
}

const ROLE_LABELS: Record<string, string> = {
  STAFF: 'Staff',
  STAFF_ADMIN: 'Staff Admin',
  ADMIN: 'Admin',
  CHIEF_COUNCIL: 'Chief & Council',
}

const DEPT_LABELS: Record<string, string> = {
  BAND_OFFICE: 'Band Office',
  J_W_HEALTH_CENTER: 'J.W. Health Center',
  CSCMEC: 'CSCMEC',
  COUNCIL: 'Council',
  RECREATION: 'Recreation',
  UTILITIES: 'Utilities',
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4']

export default function AppDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Combine email and SMS data for comparison chart
  const getCombinedActivityData = () => {
    if (!stats) return []
    return stats.charts.emails.map((email, index) => ({
      date: formatDate(email.date),
      emails: email.count,
      sms: stats.charts.sms[index]?.count || 0,
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-stone-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-stone-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-stone-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-80 bg-stone-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-stone-500">
        Failed to load dashboard data
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-amber-900">App Usage Dashboard</h2>
        <p className="text-stone-600">Monitor application activity and usage statistics</p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.overview.totalUsers}
          icon={Users}
          color="bg-gradient-to-br from-indigo-500 to-indigo-700"
          subtext={`${stats.overview.recentLogins} logins this week`}
        />
        <StatCard
          title="Emails Sent"
          value={stats.overview.totalEmails}
          icon={Mail}
          color="bg-gradient-to-br from-blue-500 to-blue-700"
          subtext={`${stats.overview.emailsLast30Days} last 30 days`}
          trend={stats.overview.emailsLast30Days > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="SMS Sent"
          value={stats.overview.totalSms}
          icon={MessageSquare}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
          subtext={`${stats.overview.smsLast30Days} last 30 days`}
          trend={stats.overview.smsLast30Days > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Bulletins Posted"
          value={stats.overview.totalBulletins}
          icon={FileText}
          color="bg-gradient-to-br from-amber-500 to-amber-700"
          subtext={`${stats.overview.bulletinsLast30Days} last 30 days`}
          trend={stats.overview.bulletinsLast30Days > 0 ? 'up' : 'neutral'}
        />
      </div>

      {/* Forms Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Sign-Up Forms"
          value={stats.overview.totalForms}
          icon={ClipboardList}
          color="bg-gradient-to-br from-purple-500 to-purple-700"
          subtext="Active forms"
        />
        <StatCard
          title="Form Submissions"
          value={stats.overview.totalSubmissions}
          icon={Activity}
          color="bg-gradient-to-br from-teal-500 to-teal-700"
          subtext="Total submissions received"
        />
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-4">Communication Activity (Last 30 Days)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getCombinedActivityData()}>
              <defs>
                <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#78716c' }}
                tickLine={false}
                axisLine={{ stroke: '#d6d3d1' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#78716c' }}
                tickLine={false}
                axisLine={{ stroke: '#d6d3d1' }}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="emails" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorEmails)" 
                name="Emails"
              />
              <Area 
                type="monotone" 
                dataKey="sms" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSms)" 
                name="SMS"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-amber-900 mb-4">Users by Role</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.usersByRole.map(r => ({ 
                    name: ROLE_LABELS[r.role] || r.role, 
                    value: r.count 
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {stats.usersByRole.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Users by Department */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-amber-900 mb-4">Users by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats.usersByDepartment.map(d => ({
                  name: DEPT_LABELS[d.department] || d.department,
                  count: d.count,
                }))}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  width={100}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Login Activity Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-4">Login Activity (Last 30 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.charts.logins.map(l => ({ date: formatDate(l.date), logins: l.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#78716c' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#78716c' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="logins" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
                name="Logins"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Emails */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-500" />
            Recent Emails
          </h3>
          {stats.recentActivity.emails.length === 0 ? (
            <p className="text-stone-500 text-sm">No recent emails</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.emails.map((email) => (
                <div key={email.id} className="flex items-start justify-between p-3 bg-stone-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">{email.subject}</p>
                    <p className="text-sm text-stone-500">
                      {email.user.first_name} {email.user.last_name} • {email.recipients.length} recipients
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      email.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {email.status}
                    </span>
                    <p className="text-xs text-stone-400 mt-1">{formatDateTime(email.created)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent SMS */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-emerald-500" />
            Recent SMS
          </h3>
          {stats.recentActivity.sms.length === 0 ? (
            <p className="text-stone-500 text-sm">No recent SMS messages</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.sms.map((sms) => (
                <div key={sms.id} className="flex items-start justify-between p-3 bg-stone-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">
                      {sms.message.length > 50 ? sms.message.substring(0, 50) + '...' : sms.message}
                    </p>
                    <p className="text-sm text-stone-500">
                      {sms.user.first_name} {sms.user.last_name} • {sms.recipients.length} recipients
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      sms.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sms.status}
                    </span>
                    <p className="text-xs text-stone-400 mt-1">{formatDateTime(sms.created)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtext, 
  trend 
}: { 
  title: string
  value: number
  icon: any
  color: string
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-md flex-shrink-0`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-500 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-stone-900">{value.toLocaleString()}</p>
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
        </div>
        {subtext && <p className="text-xs text-stone-400 mt-1">{subtext}</p>}
      </div>
    </div>
  )
}
