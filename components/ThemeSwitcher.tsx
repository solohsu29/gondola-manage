"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

export default function ThemeSwitcher() {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="px-4 cursor-pointer focus:ring-0 focus:border-none">
        <button
          onClick={() => setTheme("light")}
          className="text-foreground text-sm py-1 w-full text-left focus:ring-0 focus:border-none"
        >
          Light
        </button>
        <button
          onClick={() => setTheme("dark")}
          className="text-foreground text-sm py-1 w-full text-left focus:ring-0 focus:border-none"
        >
          Dark
        </button>
        <button
          onClick={() => setTheme("system")}
          className="text-foreground text-sm py-1 w-full text-left focus:ring-0 focus:border-none"
        >
          System
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
