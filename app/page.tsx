import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  // If user is logged in, redirect based on role
  if (session?.user) {
    const role = session.user.role
    
    // ADMIN and STAFF_ADMIN go to Admin_Home
    if (role === 'ADMIN' || role === 'STAFF_ADMIN') {
      redirect('/Admin_Home')
    } else {
      // STAFF (and any other roles) go to Staff_Home
      redirect('/Staff_Home')
    }
  }
  
  // If not logged in, redirect to login
  redirect('/login')
}
