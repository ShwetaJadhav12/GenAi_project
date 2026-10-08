import React from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'

const priorityStyles = {
  HIGH:   'bg-rose-50 text-rose-700 border-rose-200/80',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200/80',
  LOW:    'bg-emerald-50 text-emerald-700 border-emerald-200/80',
}

export default function ActionPlanCard({ item, index }) {
  return (
    <div className="card hover:shadow-card-hover transition-all duration-200 flex gap-4 items-start border-l-4 border-l-primary-500">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-700">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${priorityStyles[item.priority] || priorityStyles.LOW}`}>
            {item.priority} Priority
          </span>
          <span className="text-xs font-semibold text-slate-700">{item.issue}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-primary-50/60 border border-primary-100 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-800">
            <ArrowRight size={14} className="text-primary-600 shrink-0" />
            <span>Recommended Action: {item.action}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-600">Rationale: </span>
          {item.reason}
        </p>
      </div>
    </div>
  )
}
