"use client"

import SessionBar from '@/components/SessionBar'
import { Mail, MessageSquare, ClipboardList, CalendarDays, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function StaffHomePage() {
  const features = [
    {
      id: "communications",
      title: "Communications",
      description: "Send SMS, emails, and post bulletins to community members",
      icon: MessageSquare,
      href: "/Staff_Communications",
      color: "from-blue-500 to-blue-700",
      available: true,
    },
    {
      id: "forms",
      title: "Sign-Up Forms",
      description: "Create and manage community sign-up forms for events and services",
      icon: ClipboardList,
      href: "/Staff_Forms",
      color: "from-emerald-500 to-emerald-700",
      available: true,
    },
    {
      id: "events",
      title: "Event Planner",
      description: "Organize events, manage registrations, and coordinate prizes",
      icon: CalendarDays,
      href: "/Staff_Events",
      color: "from-purple-500 to-purple-700",
      available: false,
    },
  ]

  return (
    <div className="min-h-screen genbkg">
      <SessionBar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">Staff Dashboard</h1>
          <p className="text-stone-600">Select a feature to get started</p>
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

        {/* Quick Stats or Info Section */}
        <div className="mt-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-amber-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/Staff_Communications">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200">
                <Mail className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-medium text-amber-900">Send Email</span>
              </div>
            </Link>
            <Link href="/Staff_Communications">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200">
                <MessageSquare className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-medium text-amber-900">Send SMS</span>
              </div>
            </Link>
            <Link href="/Staff_Forms">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200">
                <ClipboardList className="h-5 w-5 text-amber-700" />
                <span className="text-sm font-medium text-amber-900">Create Form</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
