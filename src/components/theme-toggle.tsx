'use client'
import * as React from 'react'
import { Laptop, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const buttons = [
    { name: 'Light', theme: 'light', icon: Sun },
    { name: 'Dark', theme: 'dark', icon: Moon },
    { name: 'System', theme: 'system', icon: Laptop },
  ]

  return (
    <div>
      {/* Expanded View */}
      <div className="hidden space-x-1 rounded-lg bg-muted p-1 group-data-[state=expanded]:flex">
        {buttons.map((b) => (
          <Button
            key={b.theme}
            variant={theme === b.theme ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTheme(b.theme)}
            className="w-full"
            aria-label={b.name}
          >
            <b.icon className="mr-2 h-4 w-4" />
            {b.name}
          </Button>
        ))}
      </div>

      {/* Collapsed View */}
      <div className="hidden group-data-[state=collapsed]:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="center">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
