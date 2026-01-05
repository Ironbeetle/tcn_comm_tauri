"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  FileText, 
  Users, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Loader2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface Form {
  id: string
  title: string
  description: string | null
  deadline: string | null
  maxEntries: number | null
  isActive: boolean
  createdAt: string
  submissionCount: number
  fields: any[]
}

interface FormListProps {
  onCreateNew: () => void
  onViewSubmissions: (formId: string) => void
}

export default function FormList({ onCreateNew, onViewSubmissions }: FormListProps) {
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms?includeInactive=true')
      const data = await response.json()
      
      if (data.success) {
        setForms(data.forms)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
      toast.error('Failed to load forms')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        toast.success(currentStatus ? 'Form deactivated' : 'Form activated')
        fetchForms()
      } else {
        throw new Error('Failed to update form')
      }
    } catch (error) {
      toast.error('Failed to update form status')
    }
  }

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? All submissions will also be deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Form deleted')
        fetchForms()
      } else {
        throw new Error('Failed to delete form')
      }
    } catch (error) {
      toast.error('Failed to delete form')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isExpired = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-amber-900">My Forms</h3>
        <Button 
          onClick={onCreateNew}
          className="bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          <FileText className="h-16 w-16 mx-auto mb-4 text-stone-300" />
          <p className="text-lg font-medium">No forms yet</p>
          <p className="text-sm mb-4">Create your first sign-up form to get started</p>
          <Button 
            onClick={onCreateNew}
            variant="outline"
            className="border-amber-300 text-amber-900 hover:bg-amber-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <div 
              key={form.id}
              className={`p-4 rounded-xl border transition-all ${
                form.isActive 
                  ? 'bg-white border-stone-200 hover:border-amber-300' 
                  : 'bg-stone-50 border-stone-200 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-amber-900">{form.title}</h4>
                    {form.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {form.deadline && isExpired(form.deadline) && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                  
                  {form.description && (
                    <p className="text-sm text-stone-500 mt-1 line-clamp-1">{form.description}</p>
                  )}

                  <div className="flex items-center space-x-4 mt-2 text-xs text-stone-500">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {form.submissionCount} submission{form.submissionCount !== 1 ? 's' : ''}
                      {form.maxEntries && ` / ${form.maxEntries} max`}
                    </span>
                    <span className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
                    </span>
                    {form.deadline && (
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Deadline: {formatDate(form.deadline)}
                      </span>
                    )}
                    <span>Created: {formatDate(form.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewSubmissions(form.id)}
                    className="text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewSubmissions(form.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Submissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFormStatus(form.id, form.isActive)}>
                        {form.isActive ? (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteForm(form.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
