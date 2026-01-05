"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, X, CheckCircle, AlertCircle, Megaphone } from "lucide-react"
import { toast } from "sonner"

interface BulletinFormData {
  title: string
  subject: string
  category: string
  posterFile: File | null
}

export default function BulletinCreator() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<BulletinFormData>({
    title: "",
    subject: "",
    category: "ANNOUNCEMENTS",
    posterFile: null,
  })

  const categories = [
    { value: "CHIEFNCOUNCIL", label: "Chief & Council" },
    { value: "HEALTH", label: "Health" },
    { value: "EDUCATION", label: "Education" },
    { value: "RECREATION", label: "Recreation" },
    { value: "EMPLOYMENT", label: "Employment" },
    { value: "PROGRAM_EVENTS", label: "Programs & Events" },
    { value: "ANNOUNCEMENTS", label: "General Announcements" },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }

      setFormData(prev => ({ ...prev, posterFile: file }))

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearFile = () => {
    setFormData(prev => ({ ...prev, posterFile: null }))
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.subject || !formData.posterFile) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to create bulletins")
      return
    }

    setLoading(true)

    try {
      // Step 1: Create bulletin in database
      const bulletinResponse = await fetch("/api/bulletin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          subject: formData.subject,
          category: formData.category,
          userId: session.user.id,
        }),
      })

      if (!bulletinResponse.ok) {
        throw new Error("Failed to create bulletin")
      }

      const { data: bulletin } = await bulletinResponse.json()

      // Step 2: Upload poster to portal (optional - will fail gracefully if portal not available)
      try {
        const formDataToSend = new FormData()
        formDataToSend.append("file", formData.posterFile)
        formDataToSend.append("sourceId", bulletin.id)

        const posterResponse = await fetch("/api/bulletin/sync-poster", {
          method: "POST",
          body: formDataToSend,
        })

        if (posterResponse.ok) {
          const { data: posterData } = await posterResponse.json()

          // Step 3: Sync bulletin to portal
          const syncResponse = await fetch("/api/bulletin/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId: bulletin.id,
              title: formData.title,
              subject: formData.subject,
              poster_url: posterData.poster_url,
              category: formData.category,
              userId: session.user.id,
            }),
          })

          if (syncResponse.ok) {
            toast.success("Bulletin published and synced to portal!")
          } else {
            toast.success("Bulletin created locally (portal sync failed)")
          }
        } else {
          toast.success("Bulletin created locally (portal not available)")
        }
      } catch (portalError) {
        console.warn("Portal sync failed:", portalError)
        toast.success("Bulletin created locally (portal sync skipped)")
      }

      // Reset form
      setFormData({
        title: "",
        subject: "",
        category: "ANNOUNCEMENTS",
        posterFile: null,
      })
      clearFile()

    } catch (error) {
      console.error("Error creating bulletin:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create bulletin")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-amber-900">
          <Megaphone className="h-5 w-5 text-amber-700" />
          Create Bulletin
        </h2>
        <p className="text-sm text-stone-500 mt-1">Post announcements to the community bulletin board</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-amber-900 font-medium">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Community Meeting"
            required
            disabled={loading}
            className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-amber-900 font-medium">Subject *</Label>
          <Textarea
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Detailed description of the bulletin..."
            rows={4}
            required
            disabled={loading}
            className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-amber-900 font-medium">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            disabled={loading}
          >
            <SelectTrigger className="border-stone-300 focus:border-amber-500 focus:ring-amber-500">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Poster Upload */}
        <div className="space-y-2">
          <Label className="text-amber-900 font-medium">Poster Image *</Label>
          {!previewUrl ? (
            <div className="border-2 border-dashed border-amber-300 rounded-xl p-8 text-center hover:border-amber-400 hover:bg-amber-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="poster-upload"
                disabled={loading}
              />
              <label htmlFor="poster-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-amber-500" />
                <p className="mt-2 text-sm text-amber-800 font-medium">
                  Click to upload poster image
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Poster preview"
                className="w-full h-64 object-cover rounded-xl border border-stone-200"
              />
              <Button
                type="button"
                size="sm"
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white"
                onClick={clearFile}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white shadow-md" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Megaphone className="mr-2 h-4 w-4" />
              Publish Bulletin
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
