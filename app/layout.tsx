import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"




const inter = Inter({ subsets: ["latin"] })

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* ThemeProvider must be a Client Component, so it should be inside body, not at html level */}
      
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
         <Toaster />
      </body>
    </html>
  )
}
