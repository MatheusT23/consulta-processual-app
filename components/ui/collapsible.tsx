import * as React from "react"

interface CollapsibleContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

export function Collapsible({ defaultOpen, children, ...props }: { defaultOpen?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  const [open, setOpen] = React.useState(!!defaultOpen)
  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div data-state={open ? "open" : "closed"} {...props}>{children}</div>
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(CollapsibleContext)
  if (!context) return null
  const { open, setOpen } = context
  return (
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} {...props}>
      {children}
    </button>
  )
}

export function CollapsibleContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(CollapsibleContext)
  if (!context) return null
  const { open } = context
  return open ? <div {...props}>{children}</div> : null
}

