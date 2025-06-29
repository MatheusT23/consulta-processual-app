import * as React from "react";
import { cn } from "@/lib/utils";

/** Rótulo de formulário reutilizável. */

/**
 * Elemento label utilizado em formulários.
 */
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
));
Label.displayName = "Label";
