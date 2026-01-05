"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export default function SessionBar() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const { first_name, last_name, department } = session.user

  return (
    <div className="bg-gradient-to-r from-amber-700 to-amber-900 px-6 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full p-2">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-white">
                {first_name} {last_name}
              </span>
              <span className="text-amber-200 ml-2 text-sm">
                • {department.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold text-lg hidden sm:block">TCN Communications</h1>
          <Button 
            onClick={() => signOut({ callbackUrl: '/' })} 
            variant="outline" 
            size="sm"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
