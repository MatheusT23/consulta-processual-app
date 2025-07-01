import * as React from "react"
import { cn } from "@/lib/utils"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      className={cn(
        "bg-gray-200",
        orientation === "vertical" ? "w-px h-full" : "h-px w-full",
        className
      )}
      {...props}
    />
  )
}

