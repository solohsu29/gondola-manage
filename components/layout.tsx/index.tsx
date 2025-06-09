import type React from "react"
import type { Metadata } from "next"

import Sidebar from "@/components/sidebar"
import Header from "@/components/header"



export const metadata: Metadata = {
  title: "Gondola Manager",
  description: "Comprehensive gondola management system",
    generator: 'v0.dev'
}

export default function PageLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
   
          <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto bg-background">{children}</main>
            </div>
          </div>
       
  )
}
