import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusiness } from '../context/BusinessContext'
import { Store, ShoppingCart, Utensils, ShoppingBag, Package, Plus, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'

const BUSINESS_TYPES = [
  { value: 'grocery',    label: 'Grocery',    icon: ShoppingCart, desc: 'Staples, dairy, packaged food' },
  { value: 'clothing',   label: 'Clothing',   icon: ShoppingBag,  desc: 'Apparel, accessories, fashion' },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils,     desc: 'Food & beverage service' },
  { value: 'retail',     label: 'Retail',     icon: Store,        desc: 'General retail & shop' },
  { value: 'other',      label: 'Other',      icon: Package,      desc: 'Any other small business' },
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
  const { createBusiness, loadDemo, businesses, activeBusiness } = useBusiness()
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
    if (!form.business_type) { toast.error('Please select a business type'); return }
    setLoading(true)
    try {
      await createBusiness(form)
      toast.success('Business created!')
      navigate('/app/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadDemo = async (type) => {
    if (!activeBusiness) { toast.error('Create a business first'); return }
    setDemoLoading(type)
    try {
      const res = await loadDemo(type)
      toast.success(res.message)
      navigate('/app/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load demo data')
    } finally {
      setDemoLoading('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Business Setup"
        subtitle="Create your business profile to start tracking data and generating insights."
      />

      {/* Create form */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-primary-600" /> Create New Business
        </h2>

        <form onSubmit={handleCreate} className="space-y-5">
          {/* Business name */}
          <div>
            <label className="label">Business Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Sharma General Store"
              value={form.business_name}
              onChange={set('business_name')}
              required
            />
          </div>

          {/* Business type */}
          <div>
            <label className="label">Business Type <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {BUSINESS_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, business_type: t.value }))}
                  className={`
                    flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left
                    ${form.business_type === t.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <t.icon size={18} className={form.business_type === t.value ? 'text-primary-600' : 'text-gray-400'} />
                  <span className={`text-sm font-medium mt-1.5 ${form.business_type === t.value ? 'text-primary-700' : 'text-gray-700'}`}>
                    {t.label}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5 leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Currency</label>
              <select className="input" value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Location (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Mumbai, MH"
                value={form.location}
                onChange={set('location')}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? 'Creating…' : 'Create Business'}
          </button>
        </form>
      </div>

      {/* Demo data loader */}
      {activeBusiness && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <Database size={18} className="text-teal-600" /> Load Demo Data
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Populate <strong>{activeBusiness.business_name}</strong> with realistic sample transactions,
            products, and expenses so you can explore the full dashboard immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleLoadDemo('grocery')}
              disabled={!!demoLoading}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2.5"
            >
              <ShoppingCart size={16} />
              {demoLoading === 'grocery' ? 'Loading…' : 'Load Grocery Demo'}
            </button>
            <button
              onClick={() => handleLoadDemo('clothing')}
              disabled={!!demoLoading}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2.5"
            >
              <ShoppingBag size={16} />
              {demoLoading === 'clothing' ? 'Loading…' : 'Load Clothing Demo'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Demo data adds 90 days of sales, purchases, expenses, and inventory — enough to power all features.
          </p>
        </div>
      )}

      {/* Existing businesses */}
      {businesses.length > 0 && (
        <div className="mt-6 card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Businesses</h3>
          <div className="space-y-2">
            {businesses.map(b => (
              <div key={b.id} className={`flex items-center justify-between p-3 rounded-lg border ${activeBusiness?.id === b.id ? 'border-primary-200 bg-primary-50' : 'border-gray-100'}`}>
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.business_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{b.business_type} · {b.currency}</p>
                </div>
                {activeBusiness?.id === b.id && (
                  <span className="text-xs text-primary-600 font-medium bg-primary-100 px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
