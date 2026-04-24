import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-brown disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-brand-brown text-brand-bg shadow hover:bg-brand-brown/90":
              variant === "default",
            "border border-brand-brown/20 bg-white shadow-sm hover:bg-brand-brown/5 text-brand-brown":
              variant === "outline",
            "hover:bg-brand-brown/10 text-brand-brown":
              variant === "ghost",
            "bg-brand-brown/10 text-brand-brown shadow-sm hover:bg-brand-brown/20":
              variant === "secondary",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
