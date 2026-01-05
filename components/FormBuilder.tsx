"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save,
  ArrowLeft,
  Type,
  AlignLeft,
  ListOrdered,
  CheckSquare,
  Calendar,
  Hash,
  Mail,
  Phone
} from "lucide-react"
import { toast } from "sonner"

type FieldType = 'TEXT' | 'TEXTAREA' | 'SELECT' | 'MULTISELECT' | 'CHECKBOX' | 'DATE' | 'NUMBER' | 'EMAIL' | 'PHONE'

interface FormField {
  id: string
  fieldId: string  // Semantic ID for auto-fill matching (e.g., 'full_name', 'email')
  label: string
  fieldType: FieldType
  options?: string[]
  placeholder?: string
  required: boolean
  order: number
}

interface FormBuilderProps {
  onBack: () => void
  onSave: () => void
}

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string; icon: any }[] = [
  { value: 'TEXT', label: 'Text', icon: Type },
  { value: 'TEXTAREA', label: 'Long Text', icon: AlignLeft },
  { value: 'SELECT', label: 'Dropdown', icon: ListOrdered },
  { value: 'CHECKBOX', label: 'Checkbox', icon: CheckSquare },
  { value: 'DATE', label: 'Date', icon: Calendar },
  { value: 'NUMBER', label: 'Number', icon: Hash },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'PHONE', label: 'Phone', icon: Phone },
]

const CATEGORY_OPTIONS = [
  { value: 'CHIEFNCOUNCIL', label: 'Chief & Council' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'RECREATION', label: 'Recreation' },
  { value: 'EMPLOYMENT', label: 'Employment' },
  { value: 'PROGRAM_EVENTS', label: 'Programs & Events' },
  { value: 'ANNOUNCEMENTS', label: 'Announcements' },
]

export default function FormBuilder({ onBack, onSave }: FormBuilderProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("PROGRAM_EVENTS")
  const [deadline, setDeadline] = useState("")
  const [maxEntries, setMaxEntries] = useState("")
  const [fields, setFields] = useState<FormField[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate a semantic fieldId from a label (for auto-fill compatibility)
  const generateFieldId = (label: string): string => {
    return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }

  // Add default contact fields with semantic fieldIds for auto-fill
  const addDefaultFields = () => {
    const defaultFields: FormField[] = [
      { id: crypto.randomUUID(), fieldId: 'first_name', label: 'First Name', fieldType: 'TEXT', required: true, order: 0, placeholder: 'Enter your first name' },
      { id: crypto.randomUUID(), fieldId: 'last_name', label: 'Last Name', fieldType: 'TEXT', required: true, order: 1, placeholder: 'Enter your last name' },
      { id: crypto.randomUUID(), fieldId: 'email', label: 'Email', fieldType: 'EMAIL', required: true, order: 2, placeholder: 'your.email@example.com' },
      { id: crypto.randomUUID(), fieldId: 'phone', label: 'Phone Number', fieldType: 'PHONE', required: false, order: 3, placeholder: '(555) 123-4567' },
    ]
    setFields(defaultFields)
  }

  const addField = () => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      fieldId: '',  // Will be generated from label
      label: '',
      fieldType: 'TEXT',
      required: false,
      order: fields.length
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => {
      if (f.id !== id) return f
      const updatedField = { ...f, ...updates }
      // Auto-generate fieldId from label for auto-fill compatibility
      if (updates.label !== undefined) {
        updatedField.fieldId = generateFieldId(updates.label)
      }
      return updatedField
    }))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id).map((f, i) => ({ ...f, order: i })))
  }

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields]
    const [removed] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, removed)
    setFields(newFields.map((f, i) => ({ ...f, order: i })))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a form title')
      return
    }

    if (fields.length === 0) {
      toast.error('Please add at least one field')
      return
    }

    const emptyLabels = fields.filter(f => !f.label.trim())
    if (emptyLabels.length > 0) {
      toast.error('All fields must have a label')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          deadline: deadline || null,
          maxEntries: maxEntries || null,
          fields: fields.map(f => ({
            fieldId: f.fieldId || generateFieldId(f.label),  // Semantic ID for auto-fill
            label: f.label,
            fieldType: f.fieldType,
            options: f.options,
            placeholder: f.placeholder,
            required: f.required,
            order: f.order
          }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create form')
      }

      toast.success('Form created successfully!')
      
      if (!data.portalSynced) {
        toast.warning('Form saved locally but portal sync failed. It will sync when portal is available.')
      }

      onSave()
    } catch (error) {
      console.error('Error creating form:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create form')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="text-amber-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h3 className="text-xl font-bold text-amber-900">Create New Form</h3>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save & Publish'}
        </Button>
      </div>

      {/* Form Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="md:col-span-2">
          <Label htmlFor="title" className="text-amber-900">Form Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Christmas Dinner Registration"
            className="mt-1"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="description" className="text-amber-900">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the form purpose..."
            className="mt-1"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-amber-900">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="deadline" className="text-amber-900">Deadline (Optional)</Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="maxEntries" className="text-amber-900">Max Entries (Optional)</Label>
          <Input
            id="maxEntries"
            type="number"
            value={maxEntries}
            onChange={(e) => setMaxEntries(e.target.value)}
            placeholder="Leave empty for unlimited"
            className="mt-1"
          />
        </div>
      </div>

      {/* Fields Section */}
      <div className="border border-stone-200 rounded-xl overflow-hidden">
        <div className="bg-stone-100 px-4 py-3 flex items-center justify-between">
          <h4 className="font-semibold text-amber-900">Form Fields</h4>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addDefaultFields}
              disabled={fields.length > 0}
              className="text-xs"
            >
              Add Contact Fields
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addField}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <Type className="h-12 w-12 mx-auto mb-3 text-stone-300" />
              <p className="text-sm">No fields yet. Click "Add Contact Fields" to start with name, email, and phone, or "Add Field" to create custom fields.</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <div 
                key={field.id} 
                className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-stone-200"
              >
                <div className="cursor-move text-stone-400 pt-2">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <Label className="text-xs text-stone-500">Label *</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Field label"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-stone-500">Type</Label>
                    <Select 
                      value={field.fieldType} 
                      onValueChange={(v: FieldType) => updateField(field.id, { fieldType: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center">
                              <opt.icon className="h-4 w-4 mr-2" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end space-x-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(field.id, { required: !!checked })}
                      />
                      <Label htmlFor={`required-${field.id}`} className="text-xs">Required</Label>
                    </div>
                  </div>

                  {(field.fieldType === 'SELECT' || field.fieldType === 'MULTISELECT') && (
                    <div className="md:col-span-4">
                      <Label className="text-xs text-stone-500">Options (comma separated)</Label>
                      <Input
                        value={field.options?.join(', ') || ''}
                        onChange={(e) => updateField(field.id, { 
                          options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        placeholder="Option 1, Option 2, Option 3"
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="md:col-span-3">
                    <Label className="text-xs text-stone-500">Placeholder (optional)</Label>
                    <Input
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      placeholder="Placeholder text..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(field.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
