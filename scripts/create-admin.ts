/**
 * Script to create an admin user
 * Run with: npx tsx scripts/create-admin.ts
 */
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth/auth-utils'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createAdmin() {
  console.log('=== Create Admin User ===\n')

  try {
    const email = await question('Email: ')
    const password = await question('Password: ')
    const firstName = await question('First Name: ')
    const lastName = await question('Last Name: ')
    
    console.log('\nDepartment options:')
    console.log('1. BAND_OFFICE')
    console.log('2. J_W_HEALTH_CENTER')
    console.log('3. CSCMEC')
    console.log('4. COUNCIL')
    console.log('5. RECREATION')
    console.log('6. UTILITIES')
    const deptChoice = await question('Choose department (1-6): ')
    
    const departments = ['BAND_OFFICE', 'J_W_HEALTH_CENTER', 'CSCMEC', 'COUNCIL', 'RECREATION', 'UTILITIES'] as const
    const department = departments[parseInt(deptChoice) - 1] || 'BAND_OFFICE'
    
    console.log('\nRole options:')
    console.log('1. STAFF')
    console.log('2. STAFF_ADMIN')
    console.log('3. ADMIN')
    console.log('4. CHIEF_COUNCIL')
    const roleChoice = await question('Choose role (1-4): ')
    
    const roles = ['STAFF', 'STAFF_ADMIN', 'ADMIN', 'CHIEF_COUNCIL'] as const
    const role = roles[parseInt(roleChoice) - 1] || 'ADMIN'

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        department,
        role,
      },
    })

    console.log('\n✅ User created successfully!')
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.first_name} ${user.last_name}`)
    console.log(`Department: ${user.department}`)
    console.log(`Role: ${user.role}`)
  } catch (error) {
    console.error('\n❌ Error creating user:', error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

createAdmin()
