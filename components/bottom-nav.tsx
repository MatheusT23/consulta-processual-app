import Link from 'next/link'
import { Home, ClipboardList, Menu as MenuIcon } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background flex justify-around items-center py-2 md:hidden">
      <Link href="/" className="flex flex-col items-center text-xs gap-1">
        <Home className="size-6" />
        Início
      </Link>
      <Link href="/dashboard" className="-mt-6 rounded-full bg-primary text-primary-foreground p-3 shadow-lg flex flex-col items-center text-xs gap-1">
        <ClipboardList className="size-6" />
        Processos
      </Link>
      <SidebarTrigger className="flex flex-col items-center text-xs gap-1" aria-label="Menu">
        <MenuIcon className="size-6" />
        Menu
      </SidebarTrigger>
    </nav>
  )
}
