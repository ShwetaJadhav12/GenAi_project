import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, User, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { activeBusiness } = useBusiness()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {activeBusiness && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
            <span className="font-medium text-gray-800">{activeBusiness.business_name}</span>
            <span className="text-gray-300">·</span>
            <span className="capitalize">{activeBusiness.business_type}</span>
            <span className="text-gray-300">·</span>
            <span>{activeBusiness.currency}</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={14} className="text-primary-600" />
          </div>
          <span className="font-medium">{user?.name}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
