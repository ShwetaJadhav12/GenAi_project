import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, ArrowLeftRight, Package,
  Receipt, Lightbulb, TrendingUp, FlaskConical,
  MessageSquare, FileText, Settings, Store, X,
  ChevronRight,
} from 'lucide-react'
import { useBusiness } from '../context/BusinessContext'

const NAV = [
  { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/data-input',   icon: Upload,          label: 'Data Input' },
  { to: '/app/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/app/products',     icon: Package,         label: 'Products' },
  { to: '/app/expenses',     icon: Receipt,         label: 'Expenses' },
  { divider: true },
  { to: '/app/ai-insights',  icon: Lightbulb,       label: 'AI Insights' },
  { to: '/app/forecast',     icon: TrendingUp,      label: 'Forecast' },
  { to: '/app/whatif',       icon: FlaskConical,    label: 'What-If Simulator' },
  { to: '/app/ask-ai',       icon: MessageSquare,   label: 'Ask AI' },
  { divider: true },
  { to: '/app/reports',      icon: FileText,        label: 'Reports' },
  { to: '/app/settings',     icon: Settings,        label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
  const { activeBusiness, businesses, selectBusiness } = useBusiness()
  const navigate = useNavigate()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          flex flex-col w-64 bg-white border-r border-gray-100
          shadow-sm transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm leading-tight">
              AI Business<br />
              <span className="text-primary-600">Assistant</span>
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Business selector */}
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 px-2">
            Active Business
          </p>
          {activeBusiness ? (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-primary-50">
              <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {activeBusiness.business_name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{activeBusiness.business_name}</p>
                <p className="text-xs text-gray-500 capitalize">{activeBusiness.business_type}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/app/setup')}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 text-sm transition-colors"
            >
              + Add business
            </button>
          )}

          {businesses.length > 1 && (
            <select
              className="mt-2 w-full text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
              value={activeBusiness?.id || ''}
              onChange={e => {
                const b = businesses.find(x => x.id === Number(e.target.value))
                if (b) selectBusiness(b)
              }}
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.business_name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV.map((item, i) =>
            item.divider ? (
              <hr key={i} className="my-2 border-gray-100" />
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        {/* Bottom: setup shortcut */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button
            onClick={() => navigate('/app/setup')}
            className="sidebar-link w-full justify-between"
          >
            <div className="flex items-center gap-3">
              <Store size={17} />
              <span>Business Setup</span>
            </div>
            <ChevronRight size={14} className="text-gray-400" />
          </button>
        </div>
      </aside>
    </>
  )
}
