import Link from 'next/link'
import { ClipboardList, Menu as MenuIcon } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useCourt } from '@/hooks/use-court'

export function BottomNav() {
  const { court, setCourt } = useCourt()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background flex justify-around items-center md:hidden"
      style={{
        paddingTop: '0.35rem',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.35rem)'
      }}
    >
      <div className="flex flex-col items-center text-xs gap-1">
        <select
          value={court}
          onChange={(e) => setCourt(e.target.value)}
          className="bg-transparent text-center text-xs"
        >
          <option value="TRF2">TRF2</option>
          <option value="TRF2-Eproc">TRF2 - Eproc</option>
          <option value="TRF2-Captcha">TRF2 - Captcha</option>
          <option value="TRF2-Manual">TRF2 - Captcha Manual</option>
          <option value="TRT1">TRT1</option>
        </select>
      </div>
      <Link
        href="/dashboard"
        className="flex flex-col items-center text-xs gap-1"
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
