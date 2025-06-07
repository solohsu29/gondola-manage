import type React from "react"
import type { Metadata } from "next"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import PageLayout from "@/components/layout.tsx"


export const metadata: Metadata = {
  title: "Gondola Manager",
  description: "Comprehensive gondola management system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
  
          <PageLayout>
           
         
              <div>{children}</div>
          
          </PageLayout>
       
  )
}
