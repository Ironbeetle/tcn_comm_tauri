'use server'

import { signIn, signOut } from 'next-auth/react'
import prisma from '@/lib/prisma'
import {
  hashPassword,
  generatePIN,
  generatePINExpiry,
  isPINExpired,
  isAccountLocked,
} from '@/lib/auth/auth-utils'
import {
  loginSchema,
  passwordResetRequestSchema,
  passwordResetVerifySchema,
  type LoginInput,
  type PasswordResetRequestInput,
  type PasswordResetVerifyInput,
} from '@/lib/validations/auth-schemas'

/**
 * Login action
 */
export async function login(data: LoginInput) {
  try {
    // Validate input
    const validated = loginSchema.parse(data)

    // Check if user exists and account status
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (!user) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      const lockoutMinutes = Math.ceil(
        (user.lockedUntil!.getTime() - Date.now()) / (60 * 1000)
      )
      return {
        success: false,
        error: `Account is locked due to multiple failed login attempts. Try again in ${lockoutMinutes} minutes.`,
      }
    }

    // Return user info for client-side NextAuth signIn
    return {
      success: true,
      user: {
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        department: user.department,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

/**
 * Request password reset - generates PIN
 */
export async function requestPasswordReset(data: PasswordResetRequestInput) {
  try {
    const validated = passwordResetRequestSchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (!user) {
      // Don't reveal if user exists
      return {
        success: true,
        message: 'If an account exists, a PIN has been generated.',
      }
    }

    // Generate PIN and expiry
    const pin = generatePIN()
    const pinExpiresAt = generatePINExpiry()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pin,
        pinExpiresAt,
        passwordResetRequested: new Date(),
      },
    })

    // TODO: In production, send PIN via email or SMS
    // For now, log it (remove in production)
    console.log(`Password reset PIN for ${user.email}: ${pin}`)

    return {
      success: true,
      message: 'PIN generated successfully.',
    }
  } catch (error) {
    console.error('Password reset request error:', error)
    return {
      success: false,
      error: 'Failed to process password reset request.',
    }
  }
}

/**
 * Verify PIN and reset password
 */
export async function verifyPINAndResetPassword(
  data: PasswordResetVerifyInput
) {
  try {
    const validated = passwordResetVerifySchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (!user) {
      return { success: false, error: 'Invalid email or PIN' }
    }

    // Check if PIN exists
    if (!user.pin || !user.pinExpiresAt) {
      return {
        success: false,
        error: 'No password reset request found. Please request a new PIN.',
      }
    }

    // Check if PIN is expired
    if (isPINExpired(user.pinExpiresAt)) {
      return {
        success: false,
        error: 'PIN has expired. Please request a new one.',
      }
    }

    // Verify PIN
    if (user.pin !== validated.pin) {
      return { success: false, error: 'Invalid PIN' }
    }

    // Hash new password
    const hashedPassword = await hashPassword(validated.newPassword)

    // Update user password and clear PIN
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        pin: null,
        pinExpiresAt: null,
        passwordResetCompleted: new Date(),
        loginAttempts: 0,
        lockedUntil: null,
      },
    })

    return {
      success: true,
      message: 'Password reset successfully.',
    }
  } catch (error) {
    console.error('PIN verification error:', error)
    return {
      success: false,
      error: 'Failed to reset password.',
    }
  }
}

/**
 * Logout action
 */
export async function logout() {
  try {
    // NextAuth handles session cleanup
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: 'Logout failed' }
  }
}

/**
 * Get current user session data
 */
export async function getCurrentUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        department: true,
        role: true,
        lastLogin: true,
      },
    })

    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
