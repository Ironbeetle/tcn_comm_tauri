import { z } from 'zod'

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  department: z.enum(['UTILITIES', 'FINANCE', 'HOUSING'], {
    message: 'Please select a valid department'
  }),
  role: z.enum(['STAFF', 'STAFF_ADMIN', 'ADMIN', 'CHIEF_COUNCIL']).default('STAFF'),
})

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().cuid(),
})

export const userIdSchema = z.object({
  id: z.string().cuid(),
})

// SMS Log schemas
export const createSmsLogSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  recipients: z.array(z.string()).min(1, 'At least one recipient is required'),
  status: z.string(),
  messageIds: z.array(z.string()),
  error: z.string().optional(),
  userId: z.string().cuid(),
})

export const updateSmsLogSchema = createSmsLogSchema.partial().extend({
  id: z.string().cuid(),
})

// Email Log schemas
export const createEmailLogSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  status: z.string(),
  messageId: z.string().optional(),
  error: z.string().optional(),
  attachments: z.any().optional(),
  userId: z.string().cuid(),
})

export const updateEmailLogSchema = createEmailLogSchema.partial().extend({
  id: z.string().cuid(),
})

// Staff Email Log schemas
export const createStaffEmailLogSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  status: z.string(),
  messageId: z.string().optional(),
  error: z.string().optional(),
  attachments: z.any().optional(),
  userId: z.string().cuid(),
})

export const updateStaffEmailLogSchema = createStaffEmailLogSchema.partial().extend({
  id: z.string().cuid(),
})

// Message API Log schemas
export const createMsgApiLogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.string(),
  type: z.string().default('notice'),
  expiryDate: z.date().optional(),
  isPublished: z.boolean().default(false),
  userId: z.string().cuid(),
  date: z.date(),
  time: z.date(),
  location: z.string().min(1, 'Location is required'),
})

export const updateMsgApiLogSchema = createMsgApiLogSchema.partial().extend({
  id: z.string().cuid(),
})

// Message CnC schemas
export const createMsgCnCSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.string(),
  type: z.string().default('notice'),
  expiryDate: z.date().optional(),
  isPublished: z.boolean().default(false),
  userId: z.string().cuid(),
  date: z.date(),
  time: z.date(),
  location: z.string().min(1, 'Location is required'),
})

export const updateMsgCnCSchema = createMsgCnCSchema.partial().extend({
  id: z.string().cuid(),
})



// Common schemas
export const idSchema = z.object({
  id: z.string().cuid(),
})

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
})

export const searchSchema = z.object({
  query: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).merge(paginationSchema)

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateSmsLogInput = z.infer<typeof createSmsLogSchema>
export type UpdateSmsLogInput = z.infer<typeof updateSmsLogSchema>
export type CreateEmailLogInput = z.infer<typeof createEmailLogSchema>
export type UpdateEmailLogInput = z.infer<typeof updateEmailLogSchema>
export type CreateStaffEmailLogInput = z.infer<typeof createStaffEmailLogSchema>
export type UpdateStaffEmailLogInput = z.infer<typeof updateStaffEmailLogSchema>
export type CreateMsgApiLogInput = z.infer<typeof createMsgApiLogSchema>
export type UpdateMsgApiLogInput = z.infer<typeof updateMsgApiLogSchema>
export type CreateMsgCnCInput = z.infer<typeof createMsgCnCSchema>
export type UpdateMsgCnCInput = z.infer<typeof updateMsgCnCSchema>
export type SearchInput = z.infer<typeof searchSchema>