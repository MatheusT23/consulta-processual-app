import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex w-full">{children}</div>
    </SidebarContext.Provider>
  )
}

export function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(SidebarContext)
  if (!context) return null
  const { open, setOpen } = context
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      className={cn(className)}
      {...props}
    >
      ≡
    </button>
  )
}

export function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1", className)} {...props} />
}

export function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const context = React.useContext(SidebarContext)
  if (!context) return null
  const { open } = context
  return (
    <aside
      className={cn("w-64 border-r bg-gray-100 p-4", !open && "hidden md:block", className)}
      {...props}
    />
  )
}

export function SidebarRail() {
  return null
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-4", className)} {...props} />
}

export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-2", className)} {...props} />
}

export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("font-medium", className)} {...props} />
}

export function SidebarGroupContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ml-2", className)} {...props} />
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("space-y-1", className)} {...props} />
}

export function SidebarMenuItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cn(className)} {...props} />
}

export function SidebarMenuButton({ isActive, className, ...props }: { isActive?: boolean } & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("w-full text-left", isActive && "font-semibold", className)}
      {...props}
    />
  )
}

export function SidebarInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full rounded border px-2 py-1" {...props} />
}


