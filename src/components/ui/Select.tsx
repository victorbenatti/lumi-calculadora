import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

/**
 * Select nativo com aparência consistente com os demais inputs da marca.
 * Mantém o comportamento nativo (acessível e mobile-friendly).
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <select
          ref={ref}
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-brand-brown/15 bg-white pl-3 pr-9 text-sm font-medium text-brand-brown shadow-card outline-none transition-colors hover:border-brand-brown/25 focus-visible:border-brand-brown/30 focus-visible:ring-2 focus-visible:ring-brand-brown/15 disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-brown/40" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
