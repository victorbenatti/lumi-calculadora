import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-brand-brown/15 bg-white px-3 py-1 text-sm text-brand-brown shadow-card transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-brown/35 hover:border-brand-brown/25 focus-visible:border-brand-brown/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown/15 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
