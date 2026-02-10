import { Link, useLocation } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import {
  Boxes,
  Building2,
  LayoutDashboard,
  LogOut,
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

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/catalog', label: 'Catalog', icon: Boxes },
  { href: '/suppliers', label: 'Suppliers', icon: Building2 },
]

export function AppNavigation() {
  const { instance, accounts } = useMsal()
  const location = useLocation()
  const user = accounts[0]

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Check if dev bypass is active
  const isDevBypass = typeof window !== 'undefined' && sessionStorage.getItem('devBypass') === 'true'

  return (
    <header className="sticky top-0 z-50 border-b border-border/65 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_18px_28px_-18px_hsl(var(--primary)/0.9)]">
              T4S
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Li & Fung
              </p>
              <p className="text-sm font-semibold">Traceability Studio</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/'
                  ? location.pathname === '/'
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
              {isDevBypass ? 'Dev Mode' : 'Workspace Active'}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 rounded-xl px-2.5">
                  <Avatar className="h-8 w-8 ring-2 ring-background">
                    <AvatarFallback className="bg-secondary text-xs font-semibold">
                      {initials || (isDevBypass ? 'D' : 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm md:inline">
                    {user?.name || (isDevBypass ? 'Dev User' : 'User')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {user?.name || (isDevBypass ? 'Dev User' : 'Guest')}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user?.username || (isDevBypass ? 'dev@localhost' : '')}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isDevBypass ? (
                  <DropdownMenuItem
                    onClick={() => {
                      sessionStorage.removeItem('devBypass')
                      window.location.reload()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Exit Dev Mode
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => instance.logoutRedirect()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
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
