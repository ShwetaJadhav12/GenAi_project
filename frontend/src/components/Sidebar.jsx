import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, ArrowLeftRight, Package,
  Receipt, Sparkles, TrendingUp, FlaskConical,
  MessageSquare, FileText, Settings, Store, X,
  ChevronRight, CheckCircle2, ShieldCheck, ChevronDown, Share2,
  Image as ImageIcon
} from 'lucide-react'
import { useBusiness } from '../context/BusinessContext'

const NAV_GROUPS = [
  {
    title: 'Operations',
    items: [
      { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/app/data-input',   icon: Upload,          label: 'Data Input & OCR', badge: 'Smart' },
      { to: '/app/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
      { to: '/app/products',     icon: Package,         label: 'Inventory & Products' },
      { to: '/app/expenses',     icon: Receipt,         label: 'Expenses' },
    ]
  },
  {
    title: 'AI Intelligence',
    items: [
      { to: '/app/ai-insights',       icon: Sparkles,        label: 'AI Insights', badge: 'AI' },
      { to: '/app/social-generator',  icon: Share2,          label: 'Social Content Studio', badge: 'Captions' },
      { to: '/app/creative-studio',   icon: ImageIcon,       label: 'AI Poster & Reel Studio', badge: 'Media' },
      { to: '/app/forecast',          icon: TrendingUp,      label: 'Sales Forecast' },
      { to: '/app/whatif',            icon: FlaskConical,    label: 'What-If Simulator' },
      { to: '/app/ask-ai',            icon: MessageSquare,   label: 'Ask Assistant' },
    ]
  },
  {
    title: 'Workspace',
    items: [
      { to: '/app/reports',      icon: FileText,        label: 'Executive Reports' },
      { to: '/app/settings',     icon: Settings,        label: 'Settings' },
    ]
  }
]

export default function Sidebar({ open, onClose }) {
  const { activeBusiness, businesses, selectBusiness } = useBusiness()
  const navigate = useNavigate()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          flex flex-col w-64 bg-white border-r border-slate-200/80
          shadow-subtle transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-700 via-primary-600 to-primary-500 flex items-center justify-center shadow-md shadow-primary-500/20">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight">AI Assistant</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary-100 text-primary-700 uppercase">PRO</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Autonomous Operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Business Switcher Card */}
        <div className="p-3 border-b border-slate-100/90 bg-slate-50/50">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Workspace
            </p>
            {activeBusiness && (
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
              </span>
            )}
          </div>

          {activeBusiness ? (
            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                    {activeBusiness.business_name[0]?.toUpperCase() || 'B'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate leading-snug">
                      {activeBusiness.business_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 capitalize">
                      <span>{activeBusiness.business_type}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">{activeBusiness.currency || 'INR'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {businesses.length > 1 && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1">
                  <select
                    className="w-full text-[11px] font-medium border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={activeBusiness?.id || ''}
                    onChange={e => {
                      const b = businesses.find(x => x.id === Number(e.target.value))
                      if (b) selectBusiness(b)
                    }}
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>Switch: {b.business_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/app/setup')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 text-xs font-semibold transition-all"
            >
              + Create or Select Business
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose()
                    }}
                    className={({ isActive }) =>
                      `sidebar-link group ${isActive ? 'active' : ''}`
                    }
                  >
                    <item.icon size={17} className="transition-transform group-hover:scale-110" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-primary-100 text-primary-700 tracking-wide">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom AI engine status badge */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              <div>
                <p className="text-[11px] font-semibold text-slate-700">AI Engine Ready</p>
                <p className="text-[10px] text-slate-400">Deterministic Analytics</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/setup')}
              className="p-1 rounded text-slate-400 hover:text-primary-600 hover:bg-slate-50 transition-colors"
              title="Business setup"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
