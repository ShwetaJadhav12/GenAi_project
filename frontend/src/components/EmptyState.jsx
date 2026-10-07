import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Plus } from 'lucide-react'

export default function EmptyState({ title, message, action, actionLabel, icon: Icon = Database }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-primary-50/50 border border-slate-200/80 flex items-center justify-center mb-4 shadow-xs">
        <Icon size={28} className="text-primary-600" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{message}</p>
      {action && (
        <button onClick={() => navigate(action)} className="btn-primary gap-1.5">
          <Plus size={16} />
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  )
}
