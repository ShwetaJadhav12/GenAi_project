import React, { useState, useEffect } from 'react'
import {
  Sparkles, Calendar, Target, DollarSign, Share2, TrendingUp,
  Package, AlertCircle, CheckCircle2, ShieldCheck, Copy, Check,
  Download, ArrowRight, Layers, Lightbulb, Users, Megaphone,
  Instagram, Facebook, MessageCircle, Mail, Globe, Flame, Filter, RefreshCw
} from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const OBJECTIVES = [
  {
    id: 'increase_sales',
    title: 'Increase Sales & Revenue',
    desc: 'Promote high-margin top sellers and drive immediate customer purchases.',
    icon: TrendingUp,
    badge: 'High ROAS'
  },
  {
    id: 'brand_awareness',
    title: 'Brand Awareness & Reach',
    desc: 'Expand local visibility, social media reach, and customer discovery.',
    icon: Megaphone,
    badge: 'Reach'
  },
  {
    id: 'lead_generation',
    title: 'Lead Generation & VIP Contacts',
    desc: 'Capture WhatsApp numbers, store visits, and direct customer enquiries.',
    icon: Users,
    badge: 'Growth'
  },
  {
    id: 'product_launch',
    title: 'Product Collection Launch',
    desc: 'Introduce new stock arrivals, seasonal collections, or featured items.',
    icon: Sparkles,
    badge: 'Launch'
  },
  {
    id: 'clearance_inventory',
    title: 'Clear Excess Stock',
    desc: 'Prioritize slow-moving items and offer deals to free up working capital.',
    icon: Flame,
    badge: 'Clearance'
  },
]

const DURATIONS = [
  { days: 7, label: '7 Days (1 Week Quick Burst)' },
  { days: 14, label: '14 Days (2 Weeks Balanced Campaign)' },
  { days: 21, label: '21 Days (3 Weeks Push)' },
  { days: 30, label: '30 Days (Full Month Growth)' },
]

const PLATFORM_OPTIONS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-rose-500' },
  { id: 'facebook',  label: 'Facebook',  icon: Facebook,  color: 'text-blue-600' },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: MessageCircle, color: 'text-emerald-600' },
  { id: 'email',     label: 'Email',     icon: Mail,      color: 'text-amber-600' },
]

export default function CampaignPlanner() {
  const { activeBusiness } = useBusiness()
  const currency = activeBusiness?.currency || 'INR'

  // Form State
  const [objective, setObjective]               = useState('increase_sales')
  const [durationDays, setDurationDays]         = useState(14)
  const [budget, setBudget]                     = useState(10000)
  const [location, setLocation]                 = useState('')
  const [audienceNotes, setAudienceNotes]       = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'facebook', 'whatsapp', 'email'])
  const [postingCapacity, setPostingCapacity]   = useState('moderate')
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [productsList, setProductsList]         = useState([])

  // UI state
  const [loading, setLoading]                   = useState(false)
  const [campaignPlan, setCampaignPlan]         = useState(null)
  const [activeTab, setActiveTab]               = useState('calendar')
  const [filterPlatform, setFilterPlatform]     = useState('all')
  const [copiedKey, setCopiedKey]               = useState(null)

  useEffect(() => {
    if (activeBusiness) {
      setLocation(activeBusiness.location || '')
      api.get(`/businesses/${activeBusiness.id}/products`)
        .then(res => setProductsList(res.data))
        .catch(() => {})
    }
  }, [activeBusiness?.id])

  if (!activeBusiness) return <NoBusiness />

  const togglePlatform = (id) => {
    if (selectedPlatforms.includes(id)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(p => p !== id))
      } else {
        toast.error('At least one platform must be selected')
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, id])
    }
  }

  const toggleProductSelect = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(x => x !== id))
    } else {
      setSelectedProductIds([...selectedProductIds, id])
    }
  }

  const handleGenerate = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        business_id: activeBusiness.id,
        campaign_objective: objective,
        duration_days: Number(durationDays),
        total_budget: Number(budget) || 10000,
        target_location: location || undefined,
        target_audience_notes: audienceNotes || undefined,
        preferred_platforms: selectedPlatforms,
        posting_capacity: postingCapacity,
        selected_product_ids: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      }
      const res = await api.post(`/businesses/${activeBusiness.id}/ai/generate-campaign-plan`, payload)
      setCampaignPlan(res.data)
      setActiveTab('calendar')
      toast.success('Campaign Strategy & Content Calendar Generated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate campaign plan')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const calendarItems = campaignPlan?.content_calendar || []
  const filteredCalendar = calendarItems.filter(item => {
    if (filterPlatform === 'all') return true
    return item.platform?.toLowerCase().includes(filterPlatform.toLowerCase())
  })

  const valResult = campaignPlan?.validation_result

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="AI Digital Marketing Campaign Planner"
        subtitle={`Generate a complete data-driven marketing plan & calendar for ${activeBusiness.business_name} by analyzing inventory, sales trends, audience, budget, and campaign goals.`}
        badge="Autonomous Campaign AI"
      />

      {/* Main 2-column Grid: Form (5 cols) & Results (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Target size={18} className="text-primary-600" />
              <h2 className="text-sm font-bold text-slate-900">Campaign Configuration</h2>
            </div>

            {/* Step 1: Objective */}
            <div>
              <label className="label">1. Primary Campaign Objective</label>
              <div className="space-y-2">
                {OBJECTIVES.map(obj => {
                  const Icon = obj.icon
                  const selected = objective === obj.id
                  return (
                    <div
                      key={obj.id}
                      onClick={() => setObjective(obj.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                        selected
                          ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-xs font-bold ${selected ? 'text-primary-900' : 'text-slate-800'}`}>
                            {obj.title}
                          </p>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
                            {obj.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{obj.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Duration & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Campaign Duration</label>
                <select
                  className="input text-xs"
                  value={durationDays}
                  onChange={e => setDurationDays(Number(e.target.value))}
                >
                  {DURATIONS.map(d => (
                    <option key={d.days} value={d.days}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Budget ({currency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {currency}
                  </span>
                  <input
                    type="number"
                    className="input text-xs pl-10"
                    placeholder="10000"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Target Location */}
            <div>
              <label className="label">Target Location / Radius</label>
              <input
                type="text"
                className="input text-xs"
                placeholder="e.g. Mumbai Metro / 10km store radius"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            {/* Target Audience Notes */}
            <div>
              <label className="label">Target Audience / Customer Persona (Optional)</label>
              <input
                type="text"
                className="input text-xs"
                placeholder="e.g. Working women aged 22-40 interested in fashion"
                value={audienceNotes}
                onChange={e => setAudienceNotes(e.target.value)}
              />
            </div>

            {/* Product Focus Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Product Focus Selection</label>
                <span className="text-[10px] text-slate-400">
                  {selectedProductIds.length > 0 ? `${selectedProductIds.length} custom selected` : 'AI Auto-Select from DB'}
                </span>
              </div>
              {productsList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 max-h-28 overflow-y-auto">
                  {productsList.map(p => {
                    const sel = selectedProductIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProductSelect(p.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors border ${
                          sel
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sel ? '✓ ' : '+ '}{p.name} ({currency} {p.selling_price || 0})
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No products in catalog — AI will generate high-impact recommendations based on business type.</p>
              )}
            </div>

            {/* Target Channels */}
            <div>
              <label className="label">Target Channels</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORM_OPTIONS.map(p => {
                  const Icon = p.icon
                  const active = selectedPlatforms.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                        active
                          ? 'border-primary-600 bg-primary-50 text-primary-800 ring-1 ring-primary-500/20'
                          : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300'
                      }`}
                    >
                      <Icon size={14} className={p.color} />
                      <span>{p.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles size={16} />
              <span>{loading ? 'Synthesizing Full Campaign Strategy…' : 'Generate Digital Campaign Plan'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & Output */}
        <div className="lg:col-span-7 space-y-5">

          {loading && (
            <div className="card p-12 text-center space-y-3">
              <LoadingSpinner message="Analyzing products, profit margins, audience demographics, channel allocation, and generating calendar..." />
            </div>
          )}

          {!loading && !campaignPlan && (
            <div className="card border-dashed border-2 border-slate-200 text-center py-20 px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-50 to-indigo-50 border border-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                <Calendar size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">AI Campaign Planner Ready</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
                Configure your business objective, budget, and duration on the left. The AI will analyze your sales and inventory to produce a complete marketing calendar and platform strategy.
              </p>
              <button onClick={() => handleGenerate()} className="btn-primary">
                <Sparkles size={14} className="mr-1.5" /> Generate Sample Campaign Plan
              </button>
            </div>
          )}

          {!loading && campaignPlan && (
            <div className="space-y-5">
              
              {/* Campaign Header Card */}
              <div className="card bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/30 text-primary-300 border border-primary-400/30 uppercase tracking-wider">
                      {campaignPlan.campaign_objective?.replace('_', ' ').toUpperCase()}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
                      {campaignPlan.campaign_name}
                    </h2>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-[10px] text-slate-300 uppercase tracking-wider">Total Allocated Budget</p>
                    <p className="text-lg font-black text-emerald-400">{currency} {campaignPlan.total_budget?.toLocaleString()}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  {campaignPlan.strategy_summary}
                </p>

                {/* Validation Status Badge */}
                {valResult && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    valResult.status === 'PASSED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} />
                      <span className="font-bold">
                        Campaign Validator: {valResult.status === 'PASSED' ? 'All Guardrails Verified (5/5)' : 'Passed with Constraints'}
                      </span>
                    </div>
                    <span className="text-[10px] underline cursor-pointer" onClick={() => setActiveTab('strategy')}>
                      View Audit Details
                    </span>
                  </div>
                )}
              </div>

              {/* Navigation Tabs for Output */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl overflow-x-auto">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar size={14} className="text-primary-600" />
                  <span>Marketing Calendar ({calendarItems.length} Days)</span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package size={14} className="text-emerald-600" />
                  <span>Product Rationale</span>
                </button>

                <button
                  onClick={() => setActiveTab('audience')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'audience' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users size={14} className="text-indigo-600" />
                  <span>Audience &amp; Channels</span>
                </button>

                <button
                  onClick={() => setActiveTab('kpi')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'kpi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp size={14} className="text-amber-600" />
                  <span>Budget &amp; KPIs</span>
                </button>
              </div>

              {/* TAB 1: CONTENT CALENDAR (CENTRAL OUTPUT) */}
              {activeTab === 'calendar' && (
                <div className="space-y-4">
                  {/* Filter Toolbar */}
                  <div className="card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-slate-400" />
                      <span className="font-bold text-slate-700">Filter Calendar:</span>
                      <select
                        className="input text-xs py-1 px-2.5 w-auto"
                        value={filterPlatform}
                        onChange={e => setFilterPlatform(e.target.value)}
                      >
                        <option value="all">All Channels ({calendarItems.length})</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                      </select>
                    </div>

                    <button
                      onClick={() => copyToClipboard(JSON.stringify(calendarItems, null, 2), 'calendar-json')}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      {copiedKey === 'calendar-json' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'calendar-json' ? 'Copied Full Schedule' : 'Copy Calendar Schedule'}</span>
                    </button>
                  </div>

                  {/* Calendar Schedule Cards */}
                  <div className="space-y-3">
                    {filteredCalendar.map((item, idx) => (
                      <div key={idx} className="card shadow-card p-4 hover:border-primary-300 transition-all space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-800 text-xs font-black flex items-center justify-center">
                              D{item.day}
                            </span>
                            <div>
                              <span className="font-bold text-xs text-slate-900">{item.day_name}</span>
                              <span className="text-[10px] text-slate-400 ml-2">⏰ {item.suggested_time || '12:00 PM'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.platform}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-100">
                              {item.content_type}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              {item.objective}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-slate-800">{item.headline}</p>
                            <span className="text-[10px] font-semibold text-slate-400">Featured: {item.product_featured}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {item.caption_draft}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[11px] font-semibold text-slate-600">
                            <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">CTA:</span>
                            {item.call_to_action}
                          </div>

                          <button
                            onClick={() => copyToClipboard(`${item.headline}\n\n${item.caption_draft}\n\n${item.call_to_action}`, `day-${item.day}`)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                          >
                            {copiedKey === `day-${item.day}` ? <Check size={13} /> : <Copy size={13} />}
                            <span>{copiedKey === `day-${item.day}` ? 'Copied' : 'Copy Post'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCT SELECTION & RATIONALE */}
              {activeTab === 'products' && (
                <div className="card shadow-card space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Package size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">AI Product Selection &amp; Strategic Rationale</h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    The AI evaluated catalog sales trends, profit margins, stock levels, and objective alignment to pick the following focus products:
                  </p>

                  <div className="space-y-3">
                    {campaignPlan.product_selection?.map((prod, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{prod.product_name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {prod.stock_status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 space-y-1">
                          <p><strong className="text-slate-900">Why Selected:</strong> {prod.reason}</p>
                          <p><strong className="text-slate-900">Promotional Angle:</strong> {prod.promotional_angle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIENCE & CHANNELS */}
              {activeTab === 'audience' && (
                <div className="space-y-4">
                  {/* Audience card */}
                  <div className="card shadow-card space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Users size={18} className="text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Target Audience Demographics</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Age Range</span>
                        <p className="font-bold text-slate-800 mt-0.5">{campaignPlan.target_audience?.demographics?.age_range}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Location Scope</span>
                        <p className="font-bold text-slate-800 mt-0.5">{campaignPlan.target_audience?.demographics?.location_scope}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-800">Target Customer Segments:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {campaignPlan.target_audience?.demographics?.target_segments?.map((seg, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {seg}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Customer Data Limitation Notice */}
                    {campaignPlan.target_audience?.data_limitation_disclaimer && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                        <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block mb-0.5">Customer Data Limitation Notice:</span>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            {campaignPlan.target_audience.data_limitation_disclaimer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Channel Recommendations */}
                  <div className="card shadow-card space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Recommended Marketing Channels</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {campaignPlan.platform_recommendations?.map((plat, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{plat.platform}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800">
                              {currency} {plat.allocated_budget?.toLocaleString()} ({plat.budget_pct}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{plat.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BUDGET & KPIS */}
              {activeTab === 'kpi' && (
                <div className="space-y-4">
                  {/* Budget allocation */}
                  <div className="card shadow-card space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Budget Allocation Breakdown</h3>
                    <div className="space-y-2 text-xs">
                      {campaignPlan.budget_allocation?.map((b, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">{b.platform}</p>
                            <p className="text-[10px] text-slate-400">{b.purpose}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">{currency} {b.amount?.toLocaleString()}</p>
                            <p className="text-[10px] font-semibold text-slate-400">{b.percentage}% share</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance KPIs */}
                  <div className="card shadow-card space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Suggested Campaign KPIs &amp; Benchmarks</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">KPI Metric</th>
                            <th className="p-2.5">Target Benchmark</th>
                            <th className="p-2.5">Purpose</th>
                            <th className="p-2.5">Channel</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {campaignPlan.performance_tracking?.map((kpi, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-800">{kpi.metric}</td>
                              <td className="p-2.5 font-semibold text-emerald-600">{kpi.target}</td>
                              <td className="p-2.5 text-slate-600">{kpi.purpose}</td>
                              <td className="p-2.5 text-slate-500">{kpi.channel}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
