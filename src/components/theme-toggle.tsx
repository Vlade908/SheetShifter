
'use client'
import * as React from 'react'
import { Laptop, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render a placeholder or null on the server to avoid hydration mismatch
    return null
  }

  const buttons = [
    { name: 'Light', theme: 'light', icon: Sun },
    { name: 'Dark', theme: 'dark', icon: Moon },
    { name: 'System', theme: 'system', icon: Laptop },
  ]

  return (
    <div className="w-full flex justify-around rounded-lg bg-muted p-1">
      {buttons.map((b) => (
        <Button
          key={b.theme}
          variant={theme === b.theme ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTheme(b.theme)}
          className="w-9 px-0"
          aria-label={b.name}
        >
          <b.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )
}
