import type { LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"

type StatCardTone = "default" | "positive" | "attention"

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: StatCardTone
  className?: string
}

const toneStyles: Record<StatCardTone, { chip: string; value: string }> = {
  default: {
    chip: "bg-brand-sand text-brand-brown/70",
    value: "text-brand-brown",
  },
  positive: {
    chip: "bg-emerald-50 text-emerald-700",
    value: "text-emerald-800",
  },
  attention: {
    chip: "bg-amber-50 text-amber-700",
    value: "text-amber-900",
  },
}

/**
 * KPI compacto do painel admin: rótulo em overline, valor em destaque,
 * ícone em chip discreto e linha auxiliar opcional.
 */
export function StatCard({ label, value, hint, icon: Icon, tone = "default", className }: StatCardProps) {
  const styles = toneStyles[tone]

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl border border-brand-brown/8 bg-white p-4 shadow-card transition-shadow hover:shadow-lift sm:p-5",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-brown/45">
          {label}
        </p>
        <p className={cn("mt-1.5 truncate text-2xl font-bold tracking-tight", styles.value)}>
          {value}
        </p>
        {hint && (
          <p className="mt-1 truncate text-xs text-brand-brown/50">{hint}</p>
        )}
      </div>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.chip)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
    </div>
  )
}
