import { Link, useLocation } from 'react-router-dom'
import {
  Boxes,
  Building2,
  LayoutDashboard,
  Settings,
  CheckCircle2,
  ChevronDown,
  ShoppingCart,
} from 'lucide-react'

import { useWorkspace } from '@/app/contexts/workspace-context'

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
  const { activeWorkspace, setActiveWorkspace, workspaces } = useWorkspace()

  const navItems = [
    { href: `${basePath}/`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${basePath}/catalog`, label: 'Catalog', icon: Boxes },
    { href: `${basePath}/suppliers`, label: 'Suppliers', icon: Building2 },
    { href: `${basePath}/approvals`, label: 'Approvals', icon: CheckCircle2 },
    { href: `${basePath}/orders`, label: 'Orders', icon: ShoppingCart },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/65 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link to={basePath || '/'} className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_18px_28px_-18px_hsl(var(--primary)/0.9)]">
                T4S
              </div>
            </Link>

            {/* Workspace Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 justify-start gap-2 rounded-xl px-3 hover:bg-secondary/80"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {activeWorkspace.type === 'MANUFACTURER'
                        ? 'Mfg Workspace'
                        : 'Brand Workspace'}
                    </span>
                    <span className="text-sm font-semibold leading-none">
                      {activeWorkspace.name}
                    </span>
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[240px] p-2">
                <DropdownMenuLabel className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Switch Workspace
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => setActiveWorkspace(ws.id)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg p-2',
                      activeWorkspace.id === ws.id && 'bg-secondary/80'
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{ws.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ws.type}
                      </span>
                    </div>
                    {activeWorkspace.id === ws.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isDashboard = item.href === `${basePath}/`
              const isActive = isDashboard
                ? location.pathname === item.href ||
                  location.pathname === basePath
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

        {/* Mobile Nav */}
        <nav className="hide-scrollbar mt-4 flex items-center gap-2 overflow-x-auto pb-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const isDashboard = item.href === `${basePath}/`
            const isActive = isDashboard
              ? location.pathname === item.href ||
                location.pathname === basePath
              : location.pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200',
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
      </div>
    </header>
  )
}
