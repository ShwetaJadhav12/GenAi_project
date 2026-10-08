import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, LogOut, User, Bell, Search, Sparkles,
  PlusCircle, Store, ChevronDown, CheckCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { activeBusiness } = useBusiness()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
      {/* Left: Mobile hamburger & breadcrumbs / business badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {activeBusiness ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-800">{activeBusiness.business_name}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 capitalize">{activeBusiness.business_type}</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
            <span>No business selected</span>
          </div>
        )}
      </div>

      {/* Middle: Quick search mock */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div
          onClick={() => navigate('/app/ask-ai')}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-400 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-slate-400" />
            <span>Search transactions, ask AI insights, or simulate...</span>
          </div>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, AI button & User Profile */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/app/data-input')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200/80 rounded-xl transition-all"
        >
          <PlusCircle size={14} />
          <span>New Entry</span>
        </button>

        <button
          onClick={() => navigate('/app/ask-ai')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all"
        >
          <Sparkles size={13} className="text-primary-200" />
          <span className="hidden xs:inline">Ask AI</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 leading-tight">Admin</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
