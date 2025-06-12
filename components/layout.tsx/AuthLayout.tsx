import type React from "react"
import type { Metadata } from "next"


export const metadata: Metadata = {
  title: "Gondola Manager",
  description: "Comprehensive gondola management system",
    generator: 'v0.dev'
}

import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <div className="flex justify-end items-center h-16 px-4">
        <ThemeSwitcher />
      </div>
      <main className="flex-1 overflow-hidden max-h-screen bg-background">{children}</main>
    </div>
  );
}

