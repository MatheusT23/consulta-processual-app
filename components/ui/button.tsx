import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Botão reutilizável com suporte a variantes de estilo.
 */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

/**
 * Componente de botão básico utilizado pela aplicação.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base =
      "px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    const variants = {
      default: "bg-black text-white hover:bg-gray-800",
      outline: "border border-gray-300 text-gray-900 bg-white hover:bg-gray-50",
    };
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
