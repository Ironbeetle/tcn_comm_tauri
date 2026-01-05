import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'

async function updatePassword() {
  const userId = 'cmit8l0af000032c5onpifmlk'
  const newPassword = '555BXc6.1aVb'
  
  const hashedPassword = await bcrypt.hash(newPassword, 12)
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })
  
  console.log('✅ Password updated successfully!')
  console.log('Email:', user.email)
  console.log('New password:', newPassword)
  
  await prisma.$disconnect()
}

updatePassword().catch(console.error)
