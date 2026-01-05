"use client"

import SessionBar from '@/components/SessionBar'
import { Users, BarChart3, Settings, Shield, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function AdminHomePage() {
  const features = [
    {
      id: "users",
      title: "User Editor",
      description: "Manage user accounts, roles, and permissions for the application",
      icon: Users,
      href: "/Admin_Users",
      color: "from-indigo-500 to-indigo-700",
      available: true,
    },
    {
      id: "dashboard",
      title: "App Usage Dashboard",
      description: "View analytics, usage statistics, and system performance metrics",
      icon: BarChart3,
      href: "/Admin_Dashboard",
      color: "from-teal-500 to-teal-700",
      available: true,
    },
    {
      id: "settings",
      title: "System Settings",
      description: "Configure application settings and preferences",
      icon: Settings,
      href: "/Admin_Settings",
      color: "from-slate-500 to-slate-700",
      available: false,
    },
  ]

  return (
    <div className="min-h-screen genbkg">
      <SessionBar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">Admin Dashboard</h1>
          <p className="text-stone-600">Manage users and monitor application usage</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            const CardContent = (
              <div
                className={`group relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6 transition-all duration-300 ${
                  feature.available
                    ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-amber-900 mb-2 flex items-center">
                  {feature.title}
                  {feature.available && (
                    <ChevronRight className="h-5 w-5 ml-auto text-stone-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all" />
                  )}
                </h3>

                {/* Description */}
                <p className="text-sm text-stone-600">{feature.description}</p>

                {/* Coming Soon Badge */}
                {!feature.available && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-medium bg-stone-100 text-stone-500 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>
            )

            return feature.available ? (
              <Link key={feature.id} href={feature.href}>
                {CardContent}
              </Link>
            ) : (
              <div key={feature.id}>{CardContent}</div>
            )
          })}
        </div>

        {/* Quick Actions Section */}
        <div className="mt-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-amber-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/Admin_Users">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200">
                <Users className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-medium text-amber-900">Manage Users</span>
              </div>
            </Link>
            <Link href="/Admin_Dashboard">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200">
                <BarChart3 className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-medium text-amber-900">View Analytics</span>
              </div>
            </Link>
            <Link href="/Admin_Users">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200">
                <Shield className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-medium text-amber-900">User Permissions</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}