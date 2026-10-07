import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusiness } from '../context/BusinessContext'
import { Store, ShoppingCart, Utensils, ShoppingBag, Package, Plus, Database, Sparkles, Check, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'

const BUSINESS_TYPES = [
  { value: 'grocery',    label: 'Grocery & Supermarket', icon: ShoppingCart, desc: 'FMCG, dairy, provisions' },
  { value: 'clothing',   label: 'Fashion Boutique',       icon: ShoppingBag,  desc: 'Apparel, textiles, footwear' },
  { value: 'restaurant', label: 'Dining & Cafe',          icon: Utensils,     desc: 'F&B, kitchen, take-away' },
  { value: 'retail',     label: 'Specialty Retail',       icon: Store,        desc: 'Electronics, hardware, books' },
  { value: 'other',      label: 'General Trade',          icon: Package,      desc: 'Services and local commerce' },
]

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka (৳)' },
  { code: 'PKR', symbol: '₨', label: 'Pakistani Rupee (₨)' },
]

export default function BusinessSetup() {
  const { createBusiness, loadDemo, businesses, activeBusiness, selectBusiness } = useBusiness()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    business_name: '',
    business_type: '',
    currency: 'INR',
    location: '',
  })
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.business_type) { toast.error('Please choose your business category'); return }
    setLoading(true)
    try {
      await createBusiness(form)
      toast.success('Business profile activated!')
      navigate('/app/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadDemo = async (type) => {
    if (!activeBusiness) { toast.error('Please create or select a business first'); return }
    setDemoLoading(type)
    try {
      const res = await loadDemo(type)
      toast.success(res.message)
      navigate('/app/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to populate demo data')
    } finally {
      setDemoLoading('')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Business Configuration"
        subtitle="Manage organization profiles and bootstrap realistic demo operational records."
        badge="Multi-tenant"
      />

      {/* Creation card */}
      <div className="card shadow-card space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
            <Plus size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Add New Business Workspace</h2>
            <p className="text-xs text-slate-400">Configure branding and currency attributes</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Business / Shop Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Metro Mart &amp; Provisions"
              value={form.business_name}
              onChange={set('business_name')}
              required
            />
          </div>

          <div>
            <label className="label">Industry Domain *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {BUSINESS_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, business_type: t.value }))}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    form.business_type === t.value
                      ? 'border-primary-600 bg-primary-50/70 ring-2 ring-primary-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <t.icon size={18} className={form.business_type === t.value ? 'text-primary-600' : 'text-slate-400'} />
                    {form.business_type === t.value && <Check size={14} className="text-primary-600" />}
                  </div>
                  <div className="mt-2">
                    <p className={`text-xs font-bold ${form.business_type === t.value ? 'text-primary-800' : 'text-slate-800'}`}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Primary Currency</label>
              <select className="input text-xs" value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Store Location (optional)</label>
              <input
                type="text"
                className="input text-xs"
                placeholder="e.g. Bandra West, Mumbai"
                value={form.location}
                onChange={set('location')}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 shadow-md" disabled={loading}>
            {loading ? 'Configuring…' : 'Create & Open Workspace'}
          </button>
        </form>
      </div>

      {/* Demo data bootstrap card */}
      {activeBusiness && (
        <div className="card shadow-card space-y-4 bg-gradient-to-br from-slate-50 to-primary-50/30 border-primary-100">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
              <Database size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bootstrap Demo Operational Dataset</h2>
              <p className="text-[11px] text-slate-500">Seed {activeBusiness.business_name} with 90 days of transactions, products, and expenses</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Need immediate metrics to explore dashboards, forecasting curves, and AI answers? One-click demo initialization generates a realistic sales history.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleLoadDemo('grocery')}
              disabled={!!demoLoading}
              className="p-3 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 text-left transition-all shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={18} className="text-primary-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Supermarket / Grocery Demo</p>
                  <p className="text-[10px] text-slate-400">Grains, staples, dairy, daily sales</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary-600">{demoLoading === 'grocery' ? 'Loading…' : 'Load →'}</span>
            </button>

            <button
              onClick={() => handleLoadDemo('clothing')}
              disabled={!!demoLoading}
              className="p-3 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 text-left transition-all shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} className="text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Apparel Boutique Demo</p>
                  <p className="text-[10px] text-slate-400">Garments, apparel lines, sizes, styles</p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600">{demoLoading === 'clothing' ? 'Loading…' : 'Load →'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Existing workspaces list */}
      {businesses.length > 0 && (
        <div className="card shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Registered Business Workspaces</h3>
          <div className="divide-y divide-slate-100">
            {businesses.map(b => (
              <div key={b.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {b.business_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{b.business_name}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{b.business_type} · Currency: {b.currency}</p>
                  </div>
                </div>

                {activeBusiness?.id === b.id ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Workspace
                  </span>
                ) : (
                  <button
                    onClick={() => selectBusiness(b)}
                    className="btn-secondary text-xs py-1 px-2.5"
                  >
                    Switch To
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
