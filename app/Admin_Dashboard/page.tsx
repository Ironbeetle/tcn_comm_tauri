"use client"

import SessionBar from '@/components/SessionBar'
import AppDashboard from '@/components/AppDashboard'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen genbkg">
      <SessionBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link 
          href="/Admin_Home" 
          className="inline-flex items-center text-amber-700 hover:text-amber-900 mb-6 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Admin Home
        </Link>

        {/* Dashboard Component */}
        <AppDashboard />
      </div>
    </div>
  )
}
