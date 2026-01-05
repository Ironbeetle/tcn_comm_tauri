"use client"

import SessionBar from '@/components/SessionBar'
import FormBuilder from '@/components/FormBuilder'
import FormList from '@/components/FormList'
import SubmissionsViewer from '@/components/SubmissionsViewer'
import { ArrowLeft, Plus, FileText, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type ViewState = 
  | { type: "list" }
  | { type: "create" }
  | { type: "submissions"; formId: string }

export default function StaffFormsPage() {
  const [view, setView] = useState<ViewState>({ type: "list" })

  const menuItems = [
    { id: "list", label: "My Forms", icon: FileText, description: "View all forms" },
    { id: "create", label: "Create Form", icon: Plus, description: "Build a new form" },
    { id: "submissions", label: "Submissions", icon: Users, description: "View responses" },
  ]

  return (
    <div className="min-h-screen genbkg">
      <SessionBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/Staff_Home">
            <Button variant="ghost" className="text-amber-900 hover:bg-amber-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff Home
            </Button>
          </Link>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Side Menu */}
          <div className='lg:col-span-3'>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-bold text-amber-900 mb-2">Sign-Up Forms</h2>
              <p className="text-sm text-stone-500 mb-4">Manage community forms</p>
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = view.type === item.id || (item.id === "submissions" && view.type === "submissions")
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === "list") setView({ type: "list" })
                        else if (item.id === "create") setView({ type: "create" })
                        // submissions requires a formId, so clicking it goes to list
                        else if (item.id === "submissions") setView({ type: "list" })
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-md'
                          : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">{item.label}</div>
                        <div className={`text-xs ${isActive ? 'text-amber-100' : 'text-amber-700'}`}>
                          {item.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className='lg:col-span-9'>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6">
              {view.type === "list" && (
                <FormList 
                  onCreateNew={() => setView({ type: "create" })}
                  onViewSubmissions={(formId) => setView({ type: "submissions", formId })}
                />
              )}

              {view.type === "create" && (
                <FormBuilder 
                  onBack={() => setView({ type: "list" })}
                  onSave={() => setView({ type: "list" })}
                />
              )}

              {view.type === "submissions" && (
                <SubmissionsViewer 
                  formId={view.formId}
                  onBack={() => setView({ type: "list" })}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
