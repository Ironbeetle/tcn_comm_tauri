"use client"

import SessionBar from '@/components/SessionBar'
import BulletinCreator from '@/components/BulletinCreator'
import EmailComposer from '@/components/EmailComposer'
import SmsComposer from '@/components/SmsComposer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MessageSquare, Megaphone, ArrowLeft } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StaffCommunicationsPage() {
  const [activeTab, setActiveTab] = useState("sms")

  const menuItems = [
    { id: "sms", label: "SMS", icon: MessageSquare, description: "Send text messages" },
    { id: "email", label: "Email", icon: Mail, description: "Send emails" },
    { id: "bulletin", label: "Bulletin", icon: Megaphone, description: "Post bulletins" },
  ]

  return (
    <div className="min-h-screen genbkg">
      <SessionBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/Staff_Home">
            <Button variant="ghost" className="text-amber-900 hover:bg-amber-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff Home
            </Button>
          </Link>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Side Menu */}
          <div className='lg:col-span-3'>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-bold text-amber-900 mb-2">Communications</h2>
              <p className="text-sm text-stone-500 mb-4">Select a channel</p>
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-md'
                          : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">{item.label}</div>
                        <div className={`text-xs ${activeTab === item.id ? 'text-amber-100' : 'text-amber-700'}`}>
                          {item.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Communication Channel Content */}
          <div className='lg:col-span-9'>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200 p-1 mb-6">
                <TabsTrigger 
                  value="sms" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-700 data-[state=active]:to-amber-900 data-[state=active]:text-white rounded-lg"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </TabsTrigger>
                <TabsTrigger 
                  value="email"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-700 data-[state=active]:to-amber-900 data-[state=active]:text-white rounded-lg"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger 
                  value="bulletin"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-700 data-[state=active]:to-amber-900 data-[state=active]:text-white rounded-lg"
                >
                  <Megaphone className="h-4 w-4 mr-2" />
                  Bulletin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sms">
                <SmsComposer />
              </TabsContent>

              <TabsContent value="email">
                <EmailComposer />
              </TabsContent>

              <TabsContent value="bulletin">
                <BulletinCreator />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
