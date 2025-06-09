"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Package, Settings, Database } from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const [activeItem, setActiveItem] = useState<string>("/")

  useEffect(() => {
    // Update active item based on current path
    const path = pathname.split("/")[1]
    setActiveItem(path ? `/${path}` : "/")
  }, [pathname])

  return (
    <div className="w-64 border-r bg-background h-full flex flex-col">
      <div className="p-4 border-b">
        <Link href="/" className="text-xl font-bold text-blue-800">
          Gondola Manager
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          <NavItem
            href="/"
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            isActive={activeItem === "/"}
          />
          <NavItem
            href="/projects"
            icon={<FileText className="h-5 w-5" />}
            label="Projects"
            hasSubmenu
            isActive={activeItem === "/projects"}
          />
          <NavItem
            href="/gondolas"
            icon={<Package className="h-5 w-5" />}
            label="Gondolas"
            hasSubmenu
            isActive={activeItem === "/gondolas"}
          />
          <NavItem
            href="/erp-do"
            icon={<Database className="h-5 w-5" />}
            label="ERP DO"
            isActive={activeItem === "/erp-do"}
          />
        </nav>
      </div>
    
    </div>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  hasSubmenu?: boolean
  isActive?: boolean
}

function NavItem({ href, icon, label, hasSubmenu = false, isActive = false }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center px-2 py-3 rounded-md group transition-colors ${
        isActive ? "bg-blue-50 text-blue-800" : "text-gray-700 hover:bg-blue-50 hover:text-blue-800"
      }`}
    >
      <span className={`mr-3 ${isActive ? "text-blue-800" : "text-gray-500 group-hover:text-blue-800"}`}>{icon}</span>
      <span className={`flex-1 ${isActive ? "text-blue-800" : "text-foreground group-hover:text-blue-800"}`}>{label}</span>
      {hasSubmenu && (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </Link>
  )
}
