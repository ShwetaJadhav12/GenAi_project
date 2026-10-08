import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel,
  icon: Icon,
  color = 'blue',
  loading
}) {
  const colorStyles = {
    blue: {
      iconBg: 'bg-primary-50 text-primary-600 border border-primary-100',
      accent: 'border-t-primary-500',
    },
    green: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      accent: 'border-t-emerald-500',
    },
    red: {
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      accent: 'border-t-rose-500',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      accent: 'border-t-purple-500',
    },
    teal: {
      iconBg: 'bg-teal-50 text-teal-600 border border-teal-100',
      accent: 'border-t-teal-500',
    },
    orange: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      accent: 'border-t-amber-500',
    },
  }

  const style = colorStyles[color] || colorStyles.blue
  const isPositive = change > 0
  const isNegative = change < 0
  const isNeutral  = change === null || change === undefined

  return (
    <div className={`card relative overflow-hidden flex flex-col justify-between hover:shadow-card-hover transition-all duration-200 border-t-2 ${style.accent}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-28 bg-slate-100 rounded-lg animate-pulse my-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : value}{suffix}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${style.iconBg}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
        {!isNeutral && !loading ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60'
            }`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isPositive ? '+' : ''}{change?.toFixed(1)}%
            </span>
            {changeLabel && <span className="text-slate-400 font-medium">{changeLabel}</span>}
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">Real-time synced</span>
        )}
      </div>
    </div>
  )
}
