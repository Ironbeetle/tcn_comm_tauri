"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, Plus, Pencil, Trash2, Lock, Unlock, Search, 
  ChevronLeft, X, Eye, EyeOff, AlertCircle 
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// Types
interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  department: string
  role: string
  created: string
  lastLogin: string | null
  loginAttempts: number
  lockedUntil: string | null
}

type UserFormData = {
  email: string
  password: string
  first_name: string
  last_name: string
  department: string
  role: string
}

const DEPARTMENTS = [
  { value: 'BAND_OFFICE', label: 'Band Office' },
  { value: 'J_W_HEALTH_CENTER', label: 'J.W. Health Center' },
  { value: 'CSCMEC', label: 'CSCMEC' },
  { value: 'COUNCIL', label: 'Council' },
  { value: 'RECREATION', label: 'Recreation' },
  { value: 'UTILITIES', label: 'Utilities' },
]

const ROLES = [
  { value: 'STAFF', label: 'Staff' },
  { value: 'STAFF_ADMIN', label: 'Staff Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CHIEF_COUNCIL', label: 'Chief & Council' },
]

const initialFormData: UserFormData = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  department: 'BAND_OFFICE',
  role: 'STAFF',
}

export default function UserEditor() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users)
    } catch (error) {
      toast.error('Failed to load users')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users by search
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      user.first_name.toLowerCase().includes(query) ||
      user.last_name.toLowerCase().includes(query) ||
      user.department.toLowerCase().includes(query)
    )
  })

  // Open modal for creating new user
  const openCreateModal = () => {
    setEditingUser(null)
    setFormData(initialFormData)
    setShowPassword(false)
    setShowModal(true)
  }

  // Open modal for editing user
  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      department: user.department,
      role: user.role,
    })
    setShowPassword(false)
    setShowModal(true)
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PATCH' : 'POST'

      // For edit, only send password if it was changed
      const payload = editingUser && !formData.password
        ? { ...formData, password: undefined }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save user')
      }

      toast.success(editingUser ? 'User updated successfully' : 'User created successfully')
      setShowModal(false)
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete user
  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }
      toast.success('User deleted successfully')
      setDeleteConfirm(null)
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  // Handle unlock account
  const handleUnlock = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlockAccount: true }),
      })
      if (!res.ok) throw new Error('Failed to unlock account')
      toast.success('Account unlocked successfully')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to unlock account')
    }
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get department label
  const getDeptLabel = (value: string) => {
    return DEPARTMENTS.find(d => d.value === value)?.label || value
  }

  // Get role label
  const getRoleLabel = (value: string) => {
    return ROLES.find(r => r.value === value)?.label || value
  }

  // Check if user is locked
  const isLocked = (user: User) => {
    return user.lockedUntil && new Date(user.lockedUntil) > new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-900">User Management</h2>
          <p className="text-stone-600">Create, edit, and manage user accounts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
        <input
          type="text"
          placeholder="Search users by name, email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-stone-500">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            {searchQuery ? 'No users match your search' : 'No users found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700">Department</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700">Last Login</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-stone-700">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-stone-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-stone-100 text-stone-700 rounded-full">
                        {getDeptLabel(user.department)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'STAFF_ADMIN'
                          ? 'bg-blue-100 text-blue-700'
                          : user.role === 'CHIEF_COUNCIL'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-4 py-3">
                      {isLocked(user) ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isLocked(user) && (
                          <button
                            onClick={() => handleUnlock(user.id)}
                            className="p-1.5 text-stone-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Unlock account"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {session?.user?.id !== user.id && (
                          <>
                            {deleteConfirm === user.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1 text-xs bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(user.id)}
                                className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h3 className="text-lg font-bold text-amber-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    minLength={8}
                    className="w-full px-3 py-2 pr-10 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder={editingUser ? '••••••••' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!editingUser && (
                  <p className="text-xs text-stone-500 mt-1">Minimum 8 characters</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {editingUser && isLocked(editingUser) && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    This account is currently locked due to failed login attempts.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
