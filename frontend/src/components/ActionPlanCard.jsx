import React from 'react'

const priorityClass = {
  HIGH:   'badge-high',
  MEDIUM: 'badge-medium',
  LOW:    'badge-low',
}

export default function ActionPlanCard({ item, index }) {
  return (
    <div className="card flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={priorityClass[item.priority] || 'badge-low'}>
            {item.priority}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-800 mb-0.5">{item.issue}</p>
        <p className="text-sm text-primary-700 font-medium mb-0.5">→ {item.action}</p>
        <p className="text-xs text-gray-500">{item.reason}</p>
      </div>
    </div>
  )
}
