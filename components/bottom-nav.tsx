import Link from 'next/link'
import { Home, ClipboardList, Menu as MenuIcon } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background flex justify-around items-center pt-2 md:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
    >
      <Link href="/" className="flex flex-col items-center text-xs gap-1">
        <Home className="size-6" />
        Início
      </Link>
      <Link
        href="/dashboard"
        className="rounded-full bg-primary text-primary-foreground p-3 shadow-lg flex flex-col items-center text-xs gap-1"
      >
        <ClipboardList className="size-6" />
        Meus Processos
      </Link>
      <SidebarTrigger className="flex flex-col items-center text-xs gap-1" aria-label="Menu">
        <MenuIcon className="size-6" />
        Menu
      </SidebarTrigger>
    </nav>
  )
}
