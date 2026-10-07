import React from 'react'
import { Settings as SettingsIcon, Key, Info, ExternalLink, ShieldCheck, User, Store, Cpu } from 'lucide-react'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'

export default function Settings() {
  const { user } = useAuth()
  const { activeBusiness } = useBusiness()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Settings &amp; Architecture"
        subtitle="Manage user profiles, local database properties, and AI provider configurations."
      />

      {/* User profile */}
      <div className="card shadow-card space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{user?.name || 'Administrator'}</h3>
            <p className="text-xs text-slate-400">{user?.email || 'admin@business.local'}</p>
          </div>
          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
            Account Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Role Permission</p>
            <p className="font-bold text-slate-800 mt-0.5">Workspace Owner</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Session Status</p>
            <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Authenticated JWT
            </p>
          </div>
        </div>
      </div>

      {/* Active Business details */}
      {activeBusiness && (
        <div className="card shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Store size={18} className="text-primary-600" />
            <h3 className="text-sm font-bold text-slate-900">Active Business Profile</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Name</p>
              <p className="font-bold text-slate-800 mt-0.5 truncate">{activeBusiness.business_name}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Category</p>
              <p className="font-bold text-slate-800 mt-0.5 capitalize">{activeBusiness.business_type}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Currency</p>
              <p className="font-bold text-slate-800 mt-0.5">{activeBusiness.currency}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Location</p>
              <p className="font-bold text-slate-800 mt-0.5 truncate">{activeBusiness.location || 'Local'}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Engine & Provider info */}
      <div className="card shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Cpu size={18} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">AI Intelligence Core &amp; LLM Keys</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          The autonomous operations engine is configured through the project environment (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">backend/.env</code>).
          It supports Google Gemini Pro and OpenAI GPT-4o models with automated deterministic fallbacks.
        </p>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Configured LLM Provider:</span>
            <span className="font-mono font-bold text-slate-800">Google Gemini / OpenAI</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Deterministic Computation:</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <ShieldCheck size={14} /> Always Enforced (Local Python Engine)
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Offline Fallback Mode:</span>
            <span className="font-semibold text-slate-700">Supported (Rule-based heuristics)</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
          >
            <ExternalLink size={13} />
            <span>Google AI Studio Keys</span>
          </a>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
          >
            <ExternalLink size={13} />
            <span>OpenAI API Keys</span>
          </a>
        </div>
      </div>
    </div>
  )
}
