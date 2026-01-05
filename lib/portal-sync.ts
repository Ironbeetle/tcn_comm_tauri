/**
 * Portal Sync Utility
 * Handles syncing forms to/from the TCN Portal
 */

import { SignUpForm, FormField } from '@prisma/client'

const PORTAL_URL = process.env.TCN_PORTAL_URL || 'https://tcnaux.ca'
const PORTAL_API_KEY = process.env.TCN_PORTAL_API_KEY || ''

type FormWithFields = SignUpForm & { fields: FormField[] }

interface SyncResult {
  success: boolean
  error?: string
  portalFormId?: string
}

/**
 * Sync a form to the TCN Portal
 */
export async function syncFormToPortal(
  form: FormWithFields,
  category?: string,
  department?: string
): Promise<SyncResult> {
  try {
    if (!PORTAL_API_KEY) {
      console.warn('TCN_PORTAL_API_KEY not configured, skipping portal sync')
      return { success: false, error: 'Portal API key not configured' }
    }

    const payload = {
      formId: form.id,
      title: form.title,
      description: form.description,
      deadline: form.deadline?.toISOString() || null,
      maxEntries: form.maxEntries,
      isActive: form.isActive,
      category: category || 'PROGRAM_EVENTS',
      createdBy: department || 'Band Office',
      fields: form.fields.map(field => ({
        fieldId: field.fieldId || field.id,  // Use semantic fieldId for auto-fill, fallback to db id
        label: field.label,
        fieldType: field.fieldType,
        required: field.required,
        order: field.order,
        placeholder: field.placeholder,
        options: field.options ? JSON.parse(field.options) : null
      }))
    }

    const response = await fetch(`${PORTAL_URL}/api/signup-forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PORTAL_API_KEY,
        'X-Source': 'tcn-comm'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Portal returned ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      portalFormId: data.portalFormId
    }

  } catch (error) {
    console.error('Portal sync error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update a form on the TCN Portal
 */
export async function updateFormOnPortal(
  formId: string,
  updates: Partial<{
    title: string
    description: string | null
    deadline: Date | null
    maxEntries: number | null
    isActive: boolean
    category: string
    fields: FormField[]
  }>
): Promise<SyncResult> {
  try {
    if (!PORTAL_API_KEY) {
      console.warn('TCN_PORTAL_API_KEY not configured, skipping portal sync')
      return { success: false, error: 'Portal API key not configured' }
    }

    const payload: any = { ...updates }
    
    if (updates.deadline) {
      payload.deadline = updates.deadline.toISOString()
    }
    
    if (updates.fields) {
      payload.fields = updates.fields.map(field => ({
        fieldId: field.fieldId || field.id,  // Use semantic fieldId for auto-fill, fallback to db id
        label: field.label,
        fieldType: field.fieldType,
        required: field.required,
        order: field.order,
        placeholder: field.placeholder,
        options: field.options ? JSON.parse(field.options) : null
      }))
    }

    const response = await fetch(`${PORTAL_URL}/api/signup-forms/${formId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PORTAL_API_KEY,
        'X-Source': 'tcn-comm'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Portal returned ${response.status}`)
    }

    return { success: true }

  } catch (error) {
    console.error('Portal update error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete a form from the TCN Portal
 */
export async function deleteFormFromPortal(formId: string): Promise<SyncResult> {
  try {
    if (!PORTAL_API_KEY) {
      console.warn('TCN_PORTAL_API_KEY not configured, skipping portal sync')
      return { success: false, error: 'Portal API key not configured' }
    }

    const response = await fetch(`${PORTAL_URL}/api/signup-forms/${formId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': PORTAL_API_KEY,
        'X-Source': 'tcn-comm'
      }
    })

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Portal returned ${response.status}`)
    }

    return { success: true }

  } catch (error) {
    console.error('Portal delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check portal connectivity
 */
export async function checkPortalConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${PORTAL_URL}/api/health`, {
      method: 'GET',
      headers: {
        'X-API-Key': PORTAL_API_KEY
      }
    })
    return response.ok
  } catch {
    return false
  }
}
