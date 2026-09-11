import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'

export default function NoBusiness() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
        <Store size={30} className="text-primary-600" />
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-2">No Business Selected</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        You need to create or select a business before you can use this feature.
      </p>
      <button onClick={() => navigate('/app/setup')} className="btn-primary">
        Create Your Business
      </button>
    </div>
  )
}
