import { Outlet } from 'react-router-dom'
import { AppNavigation } from '@/app/components/app-navigation'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <Outlet />
    </div>
  )
}
