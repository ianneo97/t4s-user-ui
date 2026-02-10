import { Link, useLocation } from 'react-router-dom'
import {
  Boxes,
  Building2,
  LayoutDashboard,
  Settings,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Hook to get the current variant prefix (v1, v2, v3, v4, or empty)
function useVariantPrefix() {
  const location = useLocation()
  const match = location.pathname.match(/^\/(v[1-4])/)
  return match ? match[1] : ''
}

export function AppNavigation() {
  const location = useLocation()
  const variantPrefix = useVariantPrefix()
  const basePath = variantPrefix ? `/${variantPrefix}` : ''

  const navItems = [
    { href: `${basePath}/`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${basePath}/catalog`, label: 'Catalog', icon: Boxes },
    { href: `${basePath}/suppliers`, label: 'Suppliers', icon: Building2 },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/65 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link to={basePath || '/'} className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_18px_28px_-18px_hsl(var(--primary)/0.9)]">
              T4S
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Your Company
              </p>
              <p className="text-sm font-semibold">Traceability Studio</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isDashboard = item.href === `${basePath}/`
              const isActive = isDashboard
                ? location.pathname === item.href || location.pathname === basePath
                : location.pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-[0_14px_24px_-18px_hsl(var(--primary)/0.95)]'
                      : 'text-muted-foreground hover:bg-secondary/85 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="hidden rounded-full px-3 py-1 text-[11px] font-semibold md:inline-flex"
            >
              Demo Mode
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 rounded-xl px-2.5">
                  <Avatar className="h-8 w-8 ring-2 ring-background">
                    <AvatarFallback className="bg-secondary text-xs font-semibold">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm md:inline">Demo User</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Demo User</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      demo@example.com
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const isDashboard = item.href === `${basePath}/`
            const isActive = isDashboard
              ? location.pathname === item.href || location.pathname === basePath
              : location.pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/70 text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
