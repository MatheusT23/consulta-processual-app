import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface VersionSwitcherProps {
  versions: string[]
  defaultVersion: string
}

export function VersionSwitcher({ versions, defaultVersion, className, ...props }: VersionSwitcherProps & React.HTMLAttributes<HTMLDivElement>) {
  const [version, setVersion] = React.useState(defaultVersion)
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <Label className="text-xs" htmlFor="version-select">Version</Label>
      <select
        id="version-select"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        className="w-full rounded border px-2 py-1 text-sm"
      >
        {versions.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </div>
  )
}

