import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Copy, Check, Share2, Instagram, Facebook,
  MessageCircle, Linkedin, Target, TrendingUp, Flame,
  Clock, Megaphone, Tag, Send, RefreshCw, ArrowRight,
  Image as ImageIcon, Download, Film, Play, Pause, Volume2,
  VolumeX, ExternalLink, X, Heart, MessageSquare, Bookmark
} from 'lucide-react'
import { Link } from 'react-router-dom'
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

  // AI Poster / Visual Generation states (by platform)
  const [postImages, setPostImages]                     = useState({})
  const [generatingPosterFor, setGeneratingPosterFor]   = useState(null)

  // AI Reel & Video states
  const [generatedReel, setGeneratedReel]     = useState(null)
  const [generatingReel, setGeneratingReel]   = useState(false)
  const [showReelModal, setShowReelModal]     = useState(false)
  const [activeSceneIdx, setActiveSceneIdx]   = useState(0)
  const [isReelPlaying, setIsReelPlaying]     = useState(false)
  const [reelProgress, setReelProgress]       = useState(0)
  const [isVOMuted, setIsVOMuted]             = useState(false)
  const reelTimerRef = useRef(null)

  // Load product names for 1-click focus selection
  useEffect(() => {
    if (activeBusiness) {
      api.get(`/businesses/${activeBusiness.id}/products`)
        .then(res => {
          const list = res.data || []
          setProductsList(list.slice(0, 6))
          if (list.length > 0) {
            setProductTopic(curr => curr || list[0].name)
          }
        })
        .catch(() => {})
    }
  }, [activeBusiness?.id])

  // Reel playback loop
  useEffect(() => {
    if (!isReelPlaying || !generatedReel?.scenes?.length) {
      clearInterval(reelTimerRef.current)
      return
    }

    const currentScene = generatedReel.scenes[activeSceneIdx] || generatedReel.scenes[0]
    const sceneDurationMs = (currentScene.duration || 3) * 1000
    const stepMs = 100

    reelTimerRef.current = setInterval(() => {
      setReelProgress(prev => {
        const next = prev + (stepMs / sceneDurationMs) * 100
        if (next >= 100) {
          if (activeSceneIdx + 1 < generatedReel.scenes.length) {
            setActiveSceneIdx(curr => curr + 1)
          } else {
            setActiveSceneIdx(0)
          }
          return 0
        }
        return next
      })
    }, stepMs)

    return () => clearInterval(reelTimerRef.current)
  }, [isReelPlaying, activeSceneIdx, generatedReel])

  // Speech voiceover when scene changes in reel
  useEffect(() => {
    if (isReelPlaying && !isVOMuted && generatedReel?.scenes?.[activeSceneIdx]) {
      const vo = generatedReel.scenes[activeSceneIdx].voiceover
      if ('speechSynthesis' in window && vo) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(vo)
        utterance.rate = 1.05
        window.speechSynthesis.speak(utterance)
      }
    }
  }, [activeSceneIdx, isReelPlaying, isVOMuted, generatedReel])

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
      if (platform !== 'all' && r.data.platforms?.[platform]) {
        setActiveTab(platform)
      } else {
        setActiveTab('instagram')
      }
      toast.success('Captions & campaign copy generated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePoster = async (channelKey, ratio = '1:1', style = 'photorealistic') => {
    setGeneratingPosterFor(channelKey)
    try {
      const headline = result?.ad_copy?.catchy_headlines?.[0] || productTopic || activeBusiness.business_name
      const prompt = `Ready-to-post commercial marketing graphic for ${activeBusiness.business_name}. Focus: ${productTopic || 'Signature Offer'}. Tone: ${tone}. High converting marketing banner.`
      const res = await api.post(`/businesses/${activeBusiness.id}/ai/generate-image`, {
        business_id: activeBusiness.id,
        prompt,
        product_name: productTopic || undefined,
        style,
        aspect_ratio: ratio,
        text_headline: headline,
        discount_tag: offerDetails || 'Special Offer',
      })
      setPostImages(prev => ({ ...prev, [channelKey]: res.data }))
      toast.success(`${channelKey.toUpperCase()} promotional poster generated!`)
    } catch (err) {
      toast.error('Failed to generate poster')
    } finally {
      setGeneratingPosterFor(null)
    }
  }

  const handleGenerateReel = async () => {
    setGeneratingReel(true)
    try {
      const res = await api.post(`/businesses/${activeBusiness.id}/ai/generate-video`, {
        business_id: activeBusiness.id,
        prompt: `Viral commercial reel for ${productTopic || activeBusiness.business_name}. Goal: ${goal || 'Boost footfall and orders'}.`,
        product_name: productTopic || undefined,
        video_type: 'product_reel',
        aspect_ratio: '9:16',
        duration_seconds: 15,
        target_platform: 'instagram_reels',
        tone,
      })
      setGeneratedReel(res.data)
      setShowReelModal(true)
      setActiveSceneIdx(0)
      setReelProgress(0)
      setIsReelPlaying(false)
      toast.success('Viral reel storyboard generated!')
    } catch (err) {
      toast.error('Failed to generate video reel')
    } finally {
      setGeneratingReel(false)
    }
  }

  const downloadPoster = (imageUrl, filename) => {
    if (!imageUrl) return
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename || `${activeBusiness.business_name.toLowerCase().replace(/\s+/g, '-')}-poster.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download started!')
  }

  const ig = result?.platforms?.instagram
  const fb = result?.platforms?.facebook
  const wa = result?.platforms?.whatsapp
  const li = result?.platforms?.linkedin

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="AI Social Media Content &amp; Media Studio"
          subtitle={`Generate platform-specific captions, viral hashtags, and matching marketing posters &amp; reels for ${activeBusiness.business_name}.`}
          badge="Direct-to-Post AI"
        />
        <Link
          to="/app/creative-studio"
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto shrink-0 text-slate-700 bg-white"
        >
          <ImageIcon size={14} className="text-primary-600" />
          <span>Open Full Creative Studio</span>
          <ArrowRight size={13} className="text-slate-400" />
        </Link>
      </div>

      {/* Business Grounding Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-primary-50 via-indigo-50 to-purple-50 border border-primary-100/80 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {activeBusiness.business_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900">{activeBusiness.business_name}</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-primary-700 border border-primary-200 capitalize">
                {activeBusiness.business_type}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeBusiness.location ? `📍 ${activeBusiness.location}` : 'Local Store'} • Currency: {activeBusiness.currency || 'INR'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white text-emerald-700 border border-emerald-200 shadow-2xs">
            <Check size={12} className="text-emerald-600" /> Grounded in {productsList.length > 0 ? `${productsList.length} catalog products` : 'store profile'}
          </span>
        </div>
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
                  <span className="text-[10px] text-slate-400">Quick select:</span>
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
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                        productTopic === p.name
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Offer details & Tone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Special Offer Tag</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Flat 20% Off"
                  value={offerDetails}
                  onChange={e => setOfferDetails(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Brand Tone</label>
                <select
                  className="input text-xs"
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                >
                  <option value="Engaging & Friendly">Engaging &amp; Friendly</option>
                  <option value="High-Energy & Urgent">High-Energy &amp; Urgent</option>
                  <option value="Professional & Trustworthy">Professional</option>
                  <option value="Witty & Playful">Witty &amp; Playful</option>
                </select>
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="label">Target Audience</label>
              <input
                type="text"
                className="input text-xs"
                placeholder="e.g. Local families & young working professionals"
                value={audience}
                onChange={e => setAudience(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Drafting Campaign Copy…</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate Social Captions &amp; Hooks</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Previews & Visual Studio (7 cols) */}
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
                Configure your target audience and marketing goals on the left, then click Generate to create tailored posts for Instagram, Facebook, WhatsApp, and LinkedIn with matching poster images!
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
                        <p className="text-[11px] text-slate-400">Ready to post with matched image poster &amp; hashtags</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(`${ig.caption}\n\n${ig.hashtags?.join(' ')}`, 'ig-full')}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        {copiedKey === 'ig-full' ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedKey === 'ig-full' ? 'Copied' : 'Copy Full Caption'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 🖼️ DIRECT INSTAGRAM FEED POST MOCKUP (IMAGE + CAPTION READY TO POST) */}
                  <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-sm">
                    {/* Mockup Top Header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px]">
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[10px] text-slate-800">
                            {activeBusiness.business_name.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs leading-none">
                            {activeBusiness.business_name.toLowerCase().replace(/\s+/g, '_')}
                          </p>
                          <span className="text-[10px] text-slate-400">Sponsored • Follow</span>
                        </div>
                      </div>
                      <span className="text-slate-400 font-bold">•••</span>
                    </div>

                    {/* Mockup Image Area */}
                    {postImages.instagram ? (
                      <div className="relative group bg-slate-950">
                        <img
                          src={postImages.instagram.image_url}
                          alt="Instagram Marketing Poster"
                          className="w-full aspect-square object-cover"
                        />
                        {/* Dynamic Poster Banner Badge */}
                        <div className="absolute inset-x-3 bottom-3 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
                          <div>
                            {postImages.instagram.discount_tag && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider mb-0.5">
                                {postImages.instagram.discount_tag}
                              </span>
                            )}
                            <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                              {postImages.instagram.headline}
                            </h4>
                          </div>
                          <button
                            onClick={() => downloadPoster(postImages.instagram.image_url, `${activeBusiness.business_name}-instagram.jpg`)}
                            className="btn-primary text-xs py-1 px-2.5 bg-white text-slate-900 hover:bg-slate-100 flex items-center gap-1"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 bg-gradient-to-b from-slate-50 to-primary-50/20 border-b border-slate-100 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-primary-100 text-primary-600 flex items-center justify-center mx-auto shadow-xs">
                          <ImageIcon size={22} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Need a promotional image for this post?</h4>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                            Generate an AI marketing poster or video reel ready to post directly on Instagram!
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            onClick={() => handleGeneratePoster('instagram', '1:1', 'photorealistic')}
                            disabled={generatingPosterFor === 'instagram'}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                          >
                            {generatingPosterFor === 'instagram' ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <Sparkles size={12} />
                            )}
                            <span>Generate Feed Poster (1:1)</span>
                          </button>

                          <button
                            onClick={() => handleGeneratePoster('instagram', '9:16', 'vibrant_pop')}
                            disabled={generatingPosterFor === 'instagram'}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-white"
                          >
                            <span>Story Flyer (9:16)</span>
                          </button>

                          <button
                            onClick={handleGenerateReel}
                            disabled={generatingReel}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-rose-600 border-rose-200 bg-rose-50/50 hover:bg-rose-50"
                          >
                            {generatingReel ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <Film size={12} />
                            )}
                            <span>Generate Video Reel</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mockup Instagram Interaction Bar */}
                    <div className="px-3.5 pt-3 pb-2 flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-3">
                        <Heart size={18} className="hover:text-rose-500 cursor-pointer" />
                        <MessageSquare size={18} className="cursor-pointer" />
                        <Send size={18} className="cursor-pointer" />
                      </div>
                      <Bookmark size={18} className="cursor-pointer" />
                    </div>

                    {/* Mockup Caption Display */}
                    <div className="px-3.5 pb-4 text-xs text-slate-800 space-y-1.5">
                      <p className="font-semibold text-[11px] text-slate-900">428 likes</p>
                      <p className="leading-relaxed whitespace-pre-wrap">
                        <span className="font-bold mr-1.5 text-slate-900">
                          {activeBusiness.business_name.toLowerCase().replace(/\s+/g, '_')}
                        </span>
                        {ig.caption}
                      </p>
                      {ig.hashtags?.length > 0 && (
                        <p className="text-[11px] text-primary-600 font-medium">
                          {ig.hashtags.join(' ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar for Instagram Post */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {postImages.instagram ? '✅ Poster + Caption ready to post' : '💡 Tip: Download poster & copy caption to upload'}
                    </span>
                    <div className="flex items-center gap-2">
                      {postImages.instagram && (
                        <button
                          onClick={() => downloadPoster(postImages.instagram.image_url, `${activeBusiness.business_name}-instagram.jpg`)}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <Download size={13} />
                          <span>Download Poster Image</span>
                        </button>
                      )}
                      <button
                        onClick={handleGenerateReel}
                        disabled={generatingReel}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-rose-600 bg-white border-rose-200 hover:bg-rose-50"
                      >
                        {generatingReel ? <RefreshCw size={13} className="animate-spin" /> : <Film size={13} />}
                        <span>Create Video Reel</span>
                      </button>
                    </div>
                  </div>

                  {/* Hashtags list */}
                  {ig.hashtags?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="label mb-0">Hashtags ({ig.hashtags.length})</label>
                        <button
                          onClick={() => copyToClipboard(ig.hashtags.join(' '), 'ig-tags')}
                          className="text-[11px] font-semibold text-primary-600 hover:underline"
                        >
                          {copiedKey === 'ig-tags' ? 'Copied!' : 'Copy Tags'}
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
                        <p className="text-[11px] text-slate-400">Conversational copy &amp; promotional banner</p>
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

                  {/* Facebook Poster Preview */}
                  {postImages.facebook ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 relative group">
                      <img src={postImages.facebook.image_url} alt="Facebook Poster" className="w-full aspect-video object-cover" />
                      <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                        <span className="text-xs font-bold">{postImages.facebook.headline}</span>
                        <button
                          onClick={() => downloadPoster(postImages.facebook.image_url, `${activeBusiness.business_name}-facebook.jpg`)}
                          className="btn-primary text-xs py-1 px-2.5 bg-white text-slate-900"
                        >
                          <Download size={12} className="mr-1" /> Download
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <ImageIcon size={16} className="text-blue-600" />
                        <span className="font-semibold text-blue-900">Generate matching Facebook 16:9 Banner Graphic</span>
                      </div>
                      <button
                        onClick={() => handleGeneratePoster('facebook', '16:9', 'minimalist_studio')}
                        disabled={generatingPosterFor === 'facebook'}
                        className="btn-primary text-xs py-1 px-3 bg-blue-600 hover:bg-blue-700"
                      >
                        {generatingPosterFor === 'facebook' ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} className="mr-1" />}
                        Generate Banner
                      </button>
                    </div>
                  )}

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

                  {/* WhatsApp Status Flyer Generator */}
                  {postImages.whatsapp ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 relative group max-w-xs mx-auto">
                      <img src={postImages.whatsapp.image_url} alt="WhatsApp Flyer" className="w-full aspect-[9/16] object-cover" />
                      <div className="p-2.5 bg-slate-900 text-white flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{postImages.whatsapp.headline}</span>
                        <button
                          onClick={() => downloadPoster(postImages.whatsapp.image_url, `${activeBusiness.business_name}-whatsapp-flyer.jpg`)}
                          className="btn-primary text-xs py-1 px-2.5 bg-white text-slate-900"
                        >
                          <Download size={12} className="mr-1" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <ImageIcon size={16} className="text-emerald-600" />
                        <span className="font-semibold text-emerald-900">Generate 9:16 WhatsApp Status Flyer</span>
                      </div>
                      <button
                        onClick={() => handleGeneratePoster('whatsapp', '9:16', 'festive_flyer')}
                        disabled={generatingPosterFor === 'whatsapp'}
                        className="btn-primary text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {generatingPosterFor === 'whatsapp' ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} className="mr-1" />}
                        Generate Flyer
                      </button>
                    </div>
                  )}

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

                  <div>
                    <label className="label">Catchy Ad Headlines</label>
                    <div className="space-y-2">
                      {result.ad_copy.catchy_headlines?.map((hl, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
                          <span>{hl}</span>
                          <button
                            onClick={() => copyToClipboard(hl, `ad-hl-${i}`)}
                            className="p-1 rounded text-slate-400 hover:text-primary-600 transition-colors"
                          >
                            {copiedKey === `ad-hl-${i}` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

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
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🎬 INTERACTIVE REEL STORYBOARD MODAL */}
      {showReelModal && generatedReel && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Film size={18} className="text-rose-500" />
                <h3 className="text-sm font-bold text-white">{generatedReel.title}</h3>
              </div>
              <button
                onClick={() => {
                  setShowReelModal(false)
                  setIsReelPlaying(false)
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Phone Reel Simulation */}
              <div className="relative mx-auto w-full max-w-[260px] aspect-[9/16] rounded-2xl overflow-hidden bg-black border-2 border-slate-700 shadow-xl flex flex-col justify-between">
                {generatedReel.scenes?.[activeSceneIdx] && (
                  <img
                    src={generatedReel.scenes[activeSceneIdx].preview_image}
                    alt="Scene Visual"
                    className="absolute inset-0 w-full h-full object-cover brightness-90"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                {/* Progress bar */}
                <div className="relative z-10 p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1">
                    {generatedReel.scenes?.map((_, idx) => (
                      <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-100"
                          style={{
                            width: idx < activeSceneIdx ? '100%' :
                                   idx === activeSceneIdx ? `${reelProgress}%` : '0%'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/80 font-bold">
                    <span>{activeBusiness.business_name}</span>
                    <span>Scene {activeSceneIdx + 1}/{generatedReel.scenes?.length}</span>
                  </div>
                </div>

                {/* Kinetic text */}
                <div className="relative z-10 p-3 text-center my-auto">
                  {generatedReel.scenes?.[activeSceneIdx] && (
                    <div className="space-y-1.5">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white uppercase tracking-wider">
                        {generatedReel.scenes[activeSceneIdx].phase}
                      </span>
                      <h4 className="text-base font-black text-white leading-tight">
                        {generatedReel.scenes[activeSceneIdx].on_screen_text}
                      </h4>
                    </div>
                  )}
                </div>

                {/* Voiceover tag */}
                <div className="relative z-10 p-3">
                  {generatedReel.scenes?.[activeSceneIdx] && (
                    <div className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-left">
                      <p className="text-[10px] text-slate-200">
                        "{generatedReel.scenes[activeSceneIdx].voiceover}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={() => setIsReelPlaying(!isReelPlaying)}
                  className="btn-primary text-xs py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2"
                >
                  {isReelPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isReelPlaying ? 'Pause' : 'Play Animated Reel'}</span>
                </button>

                <button
                  onClick={() => setIsVOMuted(!isVOMuted)}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-rose-400"
                  title="Toggle voiceover audio"
                >
                  {isVOMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              {/* Full Voiceover copy */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase">Voiceover Narration Script:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5 line-clamp-2">{generatedReel.full_voiceover_script}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedReel.full_voiceover_script, 'modal-vo')}
                  className="btn-secondary text-xs py-1 px-2.5 bg-slate-700 text-white border-slate-600 shrink-0 ml-2"
                >
                  {copiedKey === 'modal-vo' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
