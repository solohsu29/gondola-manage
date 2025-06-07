import type React from "react"
import type { Metadata } from "next"


export const metadata: Metadata = {
  title: "Gondola Manager",
  description: "Comprehensive gondola management system",
    generator: 'v0.dev'
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
  
       
          
           
    <div className="w-full">{children}</div>
          

      
    
  )
}
