import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Database } from 'lucide-react'

export default function EmptyState({ title, message, action, actionLabel, icon: Icon = Database }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={26} className="text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-5">{message}</p>
      {action && (
        <button onClick={() => navigate(action)} className="btn-primary">
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  )
}
