import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ message = 'Analyzing data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
        <div className="w-6 h-6 rounded-full bg-primary-50 absolute" />
      </div>
      <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{message}</p>
    </div>
  )
}
