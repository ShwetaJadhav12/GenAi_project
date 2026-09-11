import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ title, value, prefix = '', suffix = '', change, changeLabel, icon: Icon, color = 'blue', loading }) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    teal:   'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  const isPositive = change > 0
  const isNeutral  = change === null || change === undefined

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : value}{suffix}
        </p>
      )}

      {!isNeutral && !loading && (
        <div className="flex items-center gap-1 text-xs">
          {isPositive
            ? <TrendingUp size={12} className="text-green-500" />
            : <TrendingDown size={12} className="text-red-500" />
          }
          <span className={isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {isPositive ? '+' : ''}{change?.toFixed(1)}%
          </span>
          {changeLabel && <span className="text-gray-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}
