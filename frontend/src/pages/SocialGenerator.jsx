import React, { useState, useEffect } from 'react'
import {
  Sparkles, Copy, Check, Share2, Instagram, Facebook,
  MessageCircle, Linkedin, Target, TrendingUp, Flame,
  Clock, Megaphone, Tag, Send, RefreshCw, ArrowRight, Calendar
} from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const PLATFORMS = [
  { id: 'all',       label: 'All Channels', icon: Share2,       color: 'bg-slate-900 text-white' },
  { id: 'instagram', label: 'Instagram',    icon: Instagram,    color: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white' },
  { id: 'facebook',  label: 'Facebook',     icon: Facebook,     color: 'bg-blue-600 text-white' },
  { id: 'whatsapp',  label: 'WhatsApp',     icon: MessageCircle, color: 'bg-emerald-600 text-white' },
  { id: 'linkedin',  label: 'LinkedIn',     icon: Linkedin,     color: 'bg-sky-700 text-white' },
]

const CONTENT_TYPES = [
  { id: 'promotional_offer', label: 'Promotional Offer', desc: 'Discounts, seasonal deals & BOGO promos' },
  { id: 'product_spotlight', label: 'Product Spotlight', desc: 'Feature top-sellers, benefits & quality' },
  { id: 'new_arrival',       label: 'New Arrivals',      desc: 'Introduce fresh stock & collections' },
  { id: 'festival_sale',     label: 'Festival / Special',desc: 'Holiday greetings & celebration sales' },
  { id: 'ad_copy',           label: 'Paid Ad Copy',      desc: 'High-converting hooks for Meta & Google ads' },
]

const AUDIENCE_PRESETS = [
  'Local families & neighbourhood residents',
  'Young professionals & college students',
  'Health & budget-conscious shoppers',
  'B2B & bulk wholesale buyers',
]

const GOAL_PRESETS = [
  'Drive instant in-store footfall today',
  'Boost direct WhatsApp / phone orders',
  'Promote a limited-time weekend discount',
  'Clear seasonal / slow-moving inventory',
]

const TONE_PRESETS = [
  'Engaging & Friendly',
  'High-Energy & Urgent',
  'Professional & Trustworthy',
  'Warm & Personal',
  'Witty & Playful',
]

export default function SocialGenerator() {
  const { activeBusiness } = useBusiness()
  const [platform, setPlatform]         = useState('all')
  const [contentType, setContentType]   = useState('promotional_offer')
  const [productTopic, setProductTopic] = useState('')
  const [audience, setAudience]         = useState('')
  const [goal, setGoal]                 = useState('')
  const [tone, setTone]                 = useState('Engaging & Friendly')
  const [offerDetails, setOfferDetails] = useState('')
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState(null)
  const [activeTab, setActiveTab]       = useState('instagram')
  const [copiedKey, setCopiedKey]       = useState(null)
  const [productsList, setProductsList] = useState([])

  // Load product names for 1-click focus selection
  useEffect(() => {
    if (activeBusiness) {
      api.get(`/businesses/${activeBusiness.id}/products`)
        .then(res => setProductsList(res.data.slice(0, 6)))
        .catch(() => {})
    }
  }, [activeBusiness?.id])

  if (!activeBusiness) return <NoBusiness />

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleGenerate = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        business_id: activeBusiness.id,
        platform,
        content_type: contentType,
        target_audience: audience || undefined,
        marketing_goal: goal || undefined,
        product_or_topic: productTopic || undefined,
        tone,
        offer_details: offerDetails || undefined,
      }
      const r = await api.post(`/businesses/${activeBusiness.id}/ai/generate-social`, payload)
      setResult(r.data)
      // Pick first active tab
      if (platform !== 'all' && r.data.platforms?.[platform]) {
        setActiveTab(platform)
      } else {
        setActiveTab('instagram')
      }
      toast.success('Campaign content generated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  const ig = result?.platforms?.instagram
  const fb = result?.platforms?.facebook
  const wa = result?.platforms?.whatsapp
  const li = result?.platforms?.linkedin

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="AI Social Media Content Studio"
        subtitle={`Generate platform-specific captions, viral hashtags, and promotional ad copy for ${activeBusiness.business_name}.`}
        badge="Multi-Channel AI"
      />

      {/* Campaign Planner Callout Banner */}
      <div className="card bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-900 text-white p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-primary-300 flex items-center justify-center shrink-0 border border-white/10">
            <Calendar size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white">Looking for a complete multi-day strategy?</h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500 text-white uppercase">New Feature</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Try the <strong className="text-white">AI Digital Marketing Campaign Planner</strong> to get a full content calendar, budget allocation, audience strategy, and validator report.
            </p>
          </div>
        </div>
        <a
          href="/app/campaign-planner"
          className="btn-primary text-xs py-2 px-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold shrink-0 flex items-center gap-1.5"
        >
          <span>Open Campaign Planner</span>
          <ArrowRight size={14} />
        </a>
      </div>


      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles size={16} className="text-primary-600" />
              <h2 className="text-sm font-bold text-slate-900">Campaign Parameters</h2>
            </div>

            {/* Target Platform */}
            <div>
              <label className="label">Target Platform</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                      platform === p.id
                        ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <p.icon size={14} className={platform === p.id ? 'text-primary-600' : 'text-slate-400'} />
                    <span className="truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label className="label">Campaign Objective</label>
              <div className="space-y-1.5">
                {CONTENT_TYPES.map(ct => (
                  <div
                    key={ct.id}
                    onClick={() => setContentType(ct.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      contentType === ct.id
                        ? 'border-primary-600 bg-primary-50/60 ring-1 ring-primary-500/20'
                        : 'border-slate-200/80 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className={`text-xs font-bold ${contentType === ct.id ? 'text-primary-800' : 'text-slate-800'}`}>
                      {ct.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{ct.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Focal Product or Topic */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Product or Offer Topic</label>
                {productsList.length > 0 && (
                  <span className="text-[10px] text-slate-400">Quick select from catalog:</span>
                )}
              </div>
              <input
                type="text"
                className="input text-xs"
                placeholder="e.g. Organic Basmati Rice / Weekend Clearance"
                value={productTopic}
                onChange={e => setProductTopic(e.target.value)}
              />
              {productsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {productsList.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProductTopic(p.name)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-600 border border-slate-200/60 transition-colors"
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Target Audience */}
            <div>
              <label className="label">Target Audience</label>
              <input
                type="text"
                className="input text-xs"
                placeholder="e.g. Families, fitness enthusiasts, students"
                value={audience}
                onChange={e => setAudience(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AUDIENCE_PRESETS.map((aud, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAudience(aud)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-600 border border-slate-200/60 transition-colors"
                  >
                    {aud}
                  </button>
                ))}
              </div>
            </div>

            {/* Marketing Goal */}
            <div>
              <label className="label">Marketing Goal</label>
              <input
                type="text"
                className="input text-xs"
                placeholder="e.g. Boost weekend footfall by 30%"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {GOAL_PRESETS.map((g, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGoal(g)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-600 border border-slate-200/60 transition-colors"
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone of Voice */}
            <div>
              <label className="label">Brand Tone</label>
              <select
                className="input text-xs"
                value={tone}
                onChange={e => setTone(e.target.value)}
              >
                {TONE_PRESETS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Offer details */}
            <div>
              <label className="label">Discount / Promo Terms (Optional)</label>
              <input
                type="text"
                className="input text-xs"
                placeholder="e.g. Flat 15% off on bills above ₹999 till Sunday"
                value={offerDetails}
                onChange={e => setOfferDetails(e.target.value)}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full py-3 shadow-md text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>{loading ? 'Synthesizing Content…' : 'Generate Marketing Copy'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Previews and Formats (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {loading && (
            <div className="card p-12 text-center">
              <LoadingSpinner message="Generating platform-specific captions, CTAs, and hashtags…" />
            </div>
          )}

          {!loading && !result && (
            <div className="card border-dashed border-2 border-slate-200 text-center py-20 px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-50 to-indigo-50 border border-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                <Megaphone size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Social Studio Ready</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
                Configure your target audience and marketing goals on the left, then click Generate to create tailored posts for Instagram, Facebook, WhatsApp, and LinkedIn.
              </p>
              <button onClick={() => handleGenerate()} className="btn-primary">
                <Sparkles size={14} className="mr-1.5" /> Generate Sample Campaign
              </button>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-5">
              {/* Channel Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl overflow-x-auto">
                <button
                  onClick={() => setActiveTab('instagram')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'instagram' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Instagram size={14} className="text-rose-500" />
                  <span>Instagram</span>
                </button>

                <button
                  onClick={() => setActiveTab('facebook')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'facebook' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Facebook size={14} className="text-blue-600" />
                  <span>Facebook</span>
                </button>

                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'whatsapp' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageCircle size={14} className="text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => setActiveTab('linkedin')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'linkedin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Linkedin size={14} className="text-sky-700" />
                  <span>LinkedIn</span>
                </button>

                <button
                  onClick={() => setActiveTab('ads')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'ads' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Flame size={14} className="text-amber-500" />
                  <span>Ad Headlines</span>
                </button>
              </div>

              {/* 📸 INSTAGRAM VIEW */}
              {activeTab === 'instagram' && ig && (
                <div className="card shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center">
                        <Instagram size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Instagram Feed &amp; Reel Copy</h3>
                        <p className="text-[11px] text-slate-400">Formatted with emoji breaks and bio CTAs</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${ig.caption}\n\n${ig.hashtags?.join(' ')}`, 'ig-full')}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      {copiedKey === 'ig-full' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'ig-full' ? 'Copied' : 'Copy Full Post'}</span>
                    </button>
                  </div>

                  {/* Hook callout */}
                  {ig.hook && (
                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
                      <span className="font-bold text-purple-900 block mb-0.5">Opening Hook:</span>
                      <p className="text-purple-800">{ig.hook}</p>
                    </div>
                  )}

                  {/* Main caption */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="label mb-0">Caption</label>
                      <button
                        onClick={() => copyToClipboard(ig.caption, 'ig-caption')}
                        className="text-[11px] font-semibold text-primary-600 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'ig-caption' ? 'Copied!' : 'Copy Caption Only'}
                      </button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                      {ig.caption}
                    </div>
                  </div>

                  {/* Call to action */}
                  {ig.cta && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Suggested CTA:</span>
                        <p className="font-bold text-slate-800 mt-0.5">{ig.cta}</p>
                      </div>
                    </div>
                  )}

                  {/* Hashtags */}
                  {ig.hashtags?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="label mb-0">Optimized Hashtags ({ig.hashtags.length})</label>
                        <button
                          onClick={() => copyToClipboard(ig.hashtags.join(' '), 'ig-tags')}
                          className="text-[11px] font-semibold text-primary-600 hover:underline"
                        >
                          {copiedKey === 'ig-tags' ? 'Copied Tags!' : 'Copy All Hashtags'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                        {ig.hashtags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-primary-700 border border-slate-200/60">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Creative Tips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {ig.story_idea && (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs">
                        <p className="font-bold text-amber-900 mb-0.5 flex items-center gap-1">
                          <Sparkles size={12} /> Story / Reel Concept
                        </p>
                        <p className="text-amber-800 text-[11px] leading-snug">{ig.story_idea}</p>
                      </div>
                    )}
                    {result?.best_time_to_post?.instagram && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <p className="font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" /> Prime Posting Hours
                        </p>
                        <p className="text-slate-600 text-[11px]">{result.best_time_to_post.instagram}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 👥 FACEBOOK VIEW */}
              {activeTab === 'facebook' && fb && (
                <div className="card shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <Facebook size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Facebook Community Post</h3>
                        <p className="text-[11px] text-slate-400">Conversational copy designed to spark shares and comments</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${fb.caption}\n\n${fb.hashtags?.join(' ')}`, 'fb-full')}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      {copiedKey === 'fb-full' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'fb-full' ? 'Copied' : 'Copy Post'}</span>
                    </button>
                  </div>

                  {fb.headline && (
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
                      <span className="font-bold text-blue-900 block mb-0.5">Post Headline:</span>
                      <p className="text-blue-800 font-semibold">{fb.headline}</p>
                    </div>
                  )}

                  <div>
                    <label className="label">Full Post Text</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {fb.caption}
                    </div>
                  </div>

                  {fb.engagement_question && (
                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
                      <span className="font-bold text-emerald-900 block mb-0.5">💬 Comment-Driving Question:</span>
                      <p className="text-emerald-800">{fb.engagement_question}</p>
                    </div>
                  )}

                  {fb.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {fb.hashtags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-blue-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 💬 WHATSAPP VIEW */}
              {activeTab === 'whatsapp' && wa && (
                <div className="card shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <MessageCircle size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">WhatsApp Broadcast &amp; Status</h3>
                        <p className="text-[11px] text-slate-400">Formatted with *bold* tags for direct customer broadcast</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(wa.message, 'wa-full')}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {copiedKey === 'wa-full' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'wa-full' ? 'Copied' : 'Copy Message'}</span>
                    </button>
                  </div>

                  {/* Simulated WhatsApp Chat Bubble */}
                  <div className="p-4 rounded-2xl bg-[#efeae2] border border-emerald-100/60 shadow-inner">
                    <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs max-w-lg shadow-xs space-y-2 border border-slate-100 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                      {wa.message}
                      <div className="text-[10px] text-slate-400 text-right mt-1">11:42 AM ✓✓</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Direct Call To Action</span>
                      <p className="font-bold text-slate-800">{wa.cta}</p>
                    </div>
                    {wa.urgency_badge && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        {wa.urgency_badge}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 💼 LINKEDIN VIEW */}
              {activeTab === 'linkedin' && li && (
                <div className="card shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-700 text-white flex items-center justify-center">
                        <Linkedin size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">LinkedIn Thought Leadership Post</h3>
                        <p className="text-[11px] text-slate-400">Founder &amp; retail operations perspective with professional metrics</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${li.post}\n\n${li.hashtags?.join(' ')}`, 'li-full')}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      {copiedKey === 'li-full' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'li-full' ? 'Copied' : 'Copy Post'}</span>
                    </button>
                  </div>

                  {li.headline && (
                    <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-xs">
                      <span className="font-bold text-sky-900 block mb-0.5">Article / Post Headline:</span>
                      <p className="text-sky-800 font-semibold">{li.headline}</p>
                    </div>
                  )}

                  <div>
                    <label className="label">Post Content</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {li.post}
                    </div>
                  </div>

                  {li.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {li.hashtags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-sky-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 🚀 AD COPY & HEADLINES VIEW */}
              {activeTab === 'ads' && result.ad_copy && (
                <div className="card shadow-card space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Flame size={18} className="text-amber-500" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">High-Converting Ad Copy &amp; Headlines</h3>
                      <p className="text-[11px] text-slate-400">Ready for Google Ads, Facebook Ads, or print signage</p>
                    </div>
                  </div>

                  {/* 3 Headlines */}
                  <div>
                    <label className="label">Catchy Ad Headlines</label>
                    <div className="space-y-2">
                      {result.ad_copy.catchy_headlines?.map((hl, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
                          <span>{hl}</span>
                          <button
                            onClick={() => copyToClipboard(hl, `ad-hl-${i}`)}
                            className="p-1 rounded text-slate-400 hover:text-primary-600 transition-colors"
                            title="Copy headline"
                          >
                            {copiedKey === `ad-hl-${i}` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary text */}
                  {result.ad_copy.primary_ad_text && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Primary Body Text</label>
                        <button
                          onClick={() => copyToClipboard(result.ad_copy.primary_ad_text, 'ad-body')}
                          className="text-[11px] font-semibold text-primary-600 hover:underline"
                        >
                          {copiedKey === 'ad-body' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-800">
                        {result.ad_copy.primary_ad_text}
                      </div>
                    </div>
                  )}

                  {/* Punchline */}
                  {result.ad_copy.short_punchline && (
                    <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-primary-600 uppercase">Short Brand Punchline</span>
                        <p className="font-extrabold text-primary-900 mt-0.5">{result.ad_copy.short_punchline}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(result.ad_copy.short_punchline, 'ad-punch')}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        {copiedKey === 'ad-punch' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}

                  {/* CTAs */}
                  {result.call_to_actions && (
                    <div>
                      <label className="label">Call-to-Action Variations</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                          <span className="text-[10px] font-bold text-rose-600 uppercase">Urgent CTA</span>
                          <p className="font-semibold text-slate-800 mt-1">{result.call_to_actions.urgent}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                          <span className="text-[10px] font-bold text-primary-600 uppercase">Conversational</span>
                          <p className="font-semibold text-slate-800 mt-1">{result.call_to_actions.conversational}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Direct Purchase</span>
                          <p className="font-semibold text-slate-800 mt-1">{result.call_to_actions.direct_order}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
