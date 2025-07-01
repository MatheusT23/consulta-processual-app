import * as React from "react"
import { cn } from "@/lib/utils"

export function Breadcrumb({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <nav className={cn("flex items-center text-sm", className)} {...props} />
}

export function BreadcrumbList({ className, ...props }: React.OlHTMLAttributes<HTMLOListElement>) {
  return <ol className={cn("flex items-center gap-2", className)} {...props} />
}

export function BreadcrumbItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cn("flex items-center gap-2", className)} {...props} />
}

export function BreadcrumbLink({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cn("hover:underline", className)} {...props} />
}

export function BreadcrumbPage({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("font-semibold", className)} {...props} />
}

export function BreadcrumbSeparator({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("", className)} aria-hidden="true" {...props}>/</span>
}

