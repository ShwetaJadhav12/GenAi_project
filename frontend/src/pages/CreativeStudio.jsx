import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Image as ImageIcon, Video, Film, Play, Pause,
  Volume2, VolumeX, Download, Copy, Check, RefreshCw,
  Palette, Sliders, Layers, Clapperboard, Music, Camera,
  Share2, ArrowRight, Tag, Megaphone, ChevronRight, Eye
} from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STYLES = [
  { id: 'photorealistic',    label: 'Photorealistic Studio', badge: 'Ultra 8K', desc: 'Commercial studio lighting, sharp depth of field, award-winning shot' },
  { id: 'minimalist_studio', label: 'Minimalist Modern',     badge: 'Clean',    desc: 'Pastel aesthetic, subtle soft shadows, high-end organic staging' },
  { id: 'luxury_editorial',  label: 'Luxury Editorial',      badge: 'Vogue',    desc: 'Moody chiaroscuro, gold & obsidian accents, 35mm film grain' },
  { id: 'vibrant_pop',       label: 'Vibrant Pop & Neon',    badge: 'Trending', desc: 'Punchy saturated colors, electric rim lights, viral social aesthetic' },
  { id: 'festive_flyer',     label: 'Festive Celebration',   badge: 'Seasonal', desc: 'Warm golden sparkles, holiday garlands, celebratory sale mood' },
  { id: '3d_render',         label: '3D Render & Clay',      badge: 'Playful',  desc: 'Octane 3D render, isometric perspective, modern smooth textures' },
]

const ASPECT_RATIOS = [
  { id: '1:1',  label: '1:1 Square',       sub: 'Instagram / FB Feed' },
  { id: '9:16', label: '9:16 Vertical',     sub: 'Reels / Stories / Shorts' },
  { id: '16:9', label: '16:9 Landscape',    sub: 'Website / YouTube' },
  { id: '4:5',  label: '4:5 Portrait',     sub: 'Instagram Portrait' },
]

const IMAGE_PRESETS = [
  { label: 'Weekend Flash Sale',  prompt: 'Grand weekend flash sale poster with glowing discount badge and luxury product display', tag: '30% OFF' },
  { label: 'New Arrival Launch',   prompt: 'Spotlight launch poster for brand new premium product collection in minimalist studio', tag: 'NEW IN' },
  { label: 'Special Festival Offer', prompt: 'Festive celebration greeting poster with golden celebratory sparkles and exclusive gift vouchers', tag: 'FESTIVAL SPECIAL' },
  { label: 'Customer Favorite',   prompt: 'Hero spotlight showcasing our #1 top-rated customer favorite product with elegant award banner', tag: 'BESTSELLER' },
]

const VIDEO_TYPES = [
  { id: 'product_reel',          label: 'Product Showcase Reel', desc: 'High-energy 360-degree product walkthrough with zoom hooks' },
  { id: 'promo_discount',        label: 'Promo & Discount Ad',   desc: 'Urgent flash-sale hook, savings breakdown, and direct order CTA' },
  { id: 'story_ad',              label: 'Founder Story & Quality', desc: 'Behind-the-scenes authenticity, handcrafted details, and trust' },
  { id: 'viral_hook',            label: 'Viral Curiosity Hook',   desc: 'Stop-scrolling curiosity gap that drives instant engagement' },
  { id: 'customer_testimonial',  label: 'Social Proof & Review',   desc: 'Relatable customer testimonial vibe that converts skeptical buyers' },
]

export default function CreativeStudio() {
  const { activeBusiness } = useBusiness()
  const [activeTab, setActiveTab] = useState('images') // 'images' | 'videos'

  // Image Generation States
  const [imgPrompt, setImgPrompt]           = useState('')
  const [imgProduct, setImgProduct]         = useState('')
  const [imgStyle, setImgStyle]             = useState('photorealistic')
  const [imgAspectRatio, setImgAspectRatio] = useState('1:1')
  const [imgHeadline, setImgHeadline]       = useState('')
  const [imgDiscountTag, setImgDiscountTag] = useState('')
  const [imgColorTheme, setImgColorTheme]   = useState('')
  const [imgLoading, setImgLoading]         = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [copiedKey, setCopiedKey]           = useState(null)

  // Video Generation States
  const [vidPrompt, setVidPrompt]           = useState('')
  const [vidProduct, setVidProduct]         = useState('')
  const [vidType, setVidType]               = useState('product_reel')
  const [vidPlatform, setVidPlatform]       = useState('instagram_reels')
  const [vidDuration, setVidDuration]       = useState(15)
  const [vidTone, setVidTone]               = useState('High-Energy & Trendy')
  const [vidLoading, setVidLoading]         = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState(null)

  // Video Player Simulation States
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0)
  const [isPlaying, setIsPlaying]             = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [isVoiceoverMuted, setIsVoiceoverMuted] = useState(false)
  const timerRef = useRef(null)

  const [productsList, setProductsList] = useState([])

  useEffect(() => {
    if (activeBusiness) {
      api.get(`/businesses/${activeBusiness.id}/products`)
        .then(res => {
          const list = res.data || []
          setProductsList(list.slice(0, 8))
          if (list.length > 0) {
            setImgProduct(curr => curr || list[0].name)
            setVidProduct(curr => curr || list[0].name)
            setImgHeadline(curr => curr || `Discover Our ${list[0].name}`)
          }
        })
        .catch(() => {})
    }
  }, [activeBusiness?.id])

  // Video scene playback ticker
  useEffect(() => {
    if (!isPlaying || !generatedVideo?.scenes?.length) {
      clearInterval(timerRef.current)
      return
    }

    const currentScene = generatedVideo.scenes[currentSceneIdx] || generatedVideo.scenes[0]
    const sceneDurationMs = (currentScene.duration || 3) * 1000
    const stepMs = 100

    timerRef.current = setInterval(() => {
      setPlaybackProgress(prev => {
        const next = prev + (stepMs / sceneDurationMs) * 100
        if (next >= 100) {
          // Advance to next scene or loop
          if (currentSceneIdx + 1 < generatedVideo.scenes.length) {
            setCurrentSceneIdx(curr => curr + 1)
          } else {
            setCurrentSceneIdx(0)
          }
          return 0
        }
        return next
      })
    }, stepMs)

    return () => clearInterval(timerRef.current)
  }, [isPlaying, currentSceneIdx, generatedVideo])

  // Optional speech narration when scene changes while playing
  useEffect(() => {
    if (isPlaying && !isVoiceoverMuted && generatedVideo?.scenes?.[currentSceneIdx]) {
      const vo = generatedVideo.scenes[currentSceneIdx].voiceover
      if ('speechSynthesis' in window && vo) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(vo)
        utterance.rate = 1.05
        window.speechSynthesis.speak(utterance)
      }
    }
  }, [currentSceneIdx, isPlaying, isVoiceoverMuted])

  if (!activeBusiness) return <NoBusiness />

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleGenerateImage = async (e) => {
    if (e) e.preventDefault()
    setImgLoading(true)
    try {
      const payload = {
        business_id: activeBusiness.id,
        prompt: imgPrompt || `Promotional hero visual for ${imgProduct || activeBusiness.business_name}`,
        product_name: imgProduct || undefined,
        style: imgStyle,
        aspect_ratio: imgAspectRatio,
        text_headline: imgHeadline || undefined,
        discount_tag: imgDiscountTag || undefined,
        color_theme: imgColorTheme || undefined,
      }
      const res = await api.post(`/businesses/${activeBusiness.id}/ai/generate-image`, payload)
      setGeneratedImage(res.data)
      toast.success('Marketing visual generated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate visual')
    } finally {
      setImgLoading(false)
    }
  }

  const handleGenerateVideo = async (e) => {
    if (e) e.preventDefault()
    setVidLoading(true)
    try {
      const payload = {
        business_id: activeBusiness.id,
        prompt: vidPrompt || `Engaging commercial reel promoting ${vidProduct || activeBusiness.business_name}`,
        product_name: vidProduct || undefined,
        video_type: vidType,
        aspect_ratio: '9:16',
        duration_seconds: vidDuration,
        target_platform: vidPlatform,
        tone: vidTone,
      }
      const res = await api.post(`/businesses/${activeBusiness.id}/ai/generate-video`, payload)
      setGeneratedVideo(res.data)
      setCurrentSceneIdx(0)
      setPlaybackProgress(0)
      setIsPlaying(false)
      toast.success('Commercial reel storyboard generated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate video storyboard')
    } finally {
      setVidLoading(false)
    }
  }

  const downloadImage = () => {
    if (!generatedImage?.image_url) return
    const link = document.createElement('a')
    link.href = generatedImage.image_url
    link.download = `${activeBusiness.business_name.toLowerCase().replace(/\s+/g, '-')}-poster.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download initiated!')
  }

  const getDynamicPresets = () => {
    const bt = (activeBusiness?.business_type || '').toLowerCase()
    const name = activeBusiness?.business_name || 'Our Store'
    const defaultProd = productsList.length > 0 ? productsList[0].name : ''

    if (bt.includes('bakery') || bt.includes('cake') || bt.includes('sweet')) {
      return [
        { 
          label: 'Oven-Fresh Bakes', 
          prompt: `Artisan golden sourdough, fresh buttery croissants and warm rustic bakery display at ${name}`, 
          headline: `Fresh From The Oven at ${name}`,
          tag: 'FRESH TODAY',
          product: defaultProd || 'Artisan Croissants & Breads',
          style: 'photorealistic'
        },
        { 
          label: 'Celebration Cakes', 
          prompt: `Handcrafted celebratory gourmet chocolate truffle cake with elegant festive topping for ${name}`, 
          headline: `Custom Celebration Cakes by ${name}`,
          tag: 'PRE-ORDER',
          product: defaultProd || 'Gourmet Chocolate Truffle Cake',
          style: 'luxury_editorial'
        },
        { 
          label: 'Morning Coffee & Pastry', 
          prompt: `Fresh hot coffee with flaky cinnamon roll and morning breakfast counter at ${name}`, 
          headline: `Morning Fresh Combos at ${name}`,
          tag: 'COMBO 20% OFF',
          product: defaultProd || 'Morning Cinnamon Roll & Coffee',
          style: 'minimalist_studio'
        },
        { 
          label: 'Weekend Treat Box', 
          prompt: `Assorted gift box of artisanal cookies, macarons, and pastries by ${name}`, 
          headline: `Weekend Sweet Treats Box`,
          tag: 'SPECIAL BOX',
          product: defaultProd || 'Pastry & Cookie Assortment',
          style: 'festive_flyer'
        },
      ]
    }
    if (bt.includes('restaurant') || bt.includes('cafe') || bt.includes('food')) {
      return [
        { 
          label: "Chef's Special Dish", 
          prompt: `Gourmet chef special signature platter with sizzling garnishes and fine dining presentation at ${name}`, 
          headline: `Taste Our Chef's Signature Dish`,
          tag: "CHEF'S PICK",
          product: defaultProd || 'Signature Chef Platter',
          style: 'photorealistic'
        },
        { 
          label: 'Weekend Dinner Deal', 
          prompt: `Luxurious restaurant dining table with appetizing food spread and candlelight at ${name}`, 
          headline: `Weekend Dining Special at ${name}`,
          tag: 'FLAT 25% OFF',
          product: defaultProd || 'Family Dining Feast',
          style: 'luxury_editorial'
        },
        { 
          label: 'Quick Lunch Box', 
          prompt: `Healthy delicious lunch combo platter fresh from the kitchen of ${name}`, 
          headline: `Executive Daily Lunch Box`,
          tag: 'DAILY SPECIAL',
          product: defaultProd || 'Deluxe Thali / Lunch Combo',
          style: 'minimalist_studio'
        },
        { 
          label: 'Beverage & Dessert Spotlight', 
          prompt: `Refreshing signature mocktail paired with decadent plated dessert at ${name}`, 
          headline: `Happy Hour Sips & Sweets`,
          tag: 'HAPPY HOURS',
          product: defaultProd || 'Signature Mocktails & Desserts',
          style: 'vibrant_pop'
        },
      ]
    }
    if (bt.includes('grocery') || bt.includes('kirana') || bt.includes('supermarket')) {
      return [
        { 
          label: 'Farm-Fresh Produce', 
          prompt: `Vibrant crisp farm-fresh organic vegetables and seasonal fruits in wooden crates at ${name}`, 
          headline: `100% Farm-Fresh Daily Greens & Fruits`,
          tag: 'FARM FRESH',
          product: defaultProd || 'Fresh Vegetables & Organic Fruits',
          style: 'photorealistic'
        },
        { 
          label: 'Monthly Ration Pack', 
          prompt: `Essential pantry staples, premium basmati rice, pulses, and cold-pressed cooking oils at ${name}`, 
          headline: `Monthly Grocery Super Saver Pack`,
          tag: 'SAVE ₹500',
          product: defaultProd || 'Monthly Kitchen Staples & Grains',
          style: 'minimalist_studio'
        },
        { 
          label: 'Daily Dairy & Breakfast', 
          prompt: `Fresh milk, farm eggs, artisan butter, and morning essentials at ${name}`, 
          headline: `Fresh Morning Dairy & Daily Essentials`,
          tag: 'DAILY DEALS',
          product: defaultProd || 'Fresh Milk, Butter & Breakfast Goods',
          style: 'minimalist_studio'
        },
        { 
          label: 'Weekend Super Savings', 
          prompt: `Supermarket aisles filled with packaged family groceries and bright discount tags at ${name}`, 
          headline: `Mega Weekend Grocery Clearance at ${name}`,
          tag: 'FLAT 15% OFF',
          product: defaultProd || 'Packaged Foods & Snacks',
          style: 'vibrant_pop'
        },
      ]
    }
    if (bt.includes('fashion') || bt.includes('clothing') || bt.includes('boutique')) {
      return [
        { 
          label: 'New Season Collection', 
          prompt: `Trending designer apparel and contemporary outfit showcase for ${name} in luxury modern studio`, 
          headline: `New Season Arrivals at ${name}`,
          tag: 'NEW IN STORE',
          product: defaultProd || 'Designer Kurti & Western Outfits',
          style: 'luxury_editorial'
        },
        { 
          label: 'Festive Ethnic Wear', 
          prompt: `Graceful traditional festive silk wear with intricate embroidery from ${name}`, 
          headline: `Royal Festive Silk & Ethnic Drop`,
          tag: 'FESTIVE 30%',
          product: defaultProd || 'Pure Silk Saree & Kurtis',
          style: 'festive_flyer'
        },
        { 
          label: 'Weekend Clearance', 
          prompt: `Trendy boutique rack with premium wardrobe essentials and sale tags at ${name}`, 
          headline: `Exclusive Weekend Wardrobe Sale`,
          tag: 'UP TO 50% OFF',
          product: defaultProd || 'Cotton T-Shirts & Denim Jeans',
          style: 'vibrant_pop'
        },
        { 
          label: 'Casual Everyday Wear', 
          prompt: `Comfortable breathable premium cotton everyday wear on minimalist aesthetic hanger`, 
          headline: `Effortless Everyday Comfort by ${name}`,
          tag: 'BEST VALUE',
          product: defaultProd || 'Men & Women Cotton Everyday Wear',
          style: 'photorealistic'
        },
      ]
    }
    return [
      { 
        label: 'Weekend Flash Sale', 
        prompt: `Grand weekend promotional advertisement poster with discount badge for ${name}`, 
        headline: `Super Weekend Flash Sale at ${name}`,
        tag: '30% OFF',
        product: defaultProd || 'Signature Collection',
        style: 'vibrant_pop'
      },
      { 
        label: 'New Arrival Launch', 
        prompt: `Spotlight launch poster for brand new premium product collection by ${name}`, 
        headline: `Introducing The New Collection at ${name}`,
        tag: 'NEW IN',
        product: defaultProd || 'New Arrivals',
        style: 'luxury_editorial'
      },
      { 
        label: 'Festive Celebration', 
        prompt: `Festive greeting and exclusive gift voucher promotion for ${name}`, 
        headline: `Celebrate With Special Savings at ${name}`,
        tag: 'FESTIVAL SPECIAL',
        product: defaultProd || 'Gift Hampers & Festive Specials',
        style: 'festive_flyer'
      },
      { 
        label: 'Customer Favorite', 
        prompt: `Top-rated customer favorite product with elegant award banner at ${name}`, 
        headline: `Rated #1 Customer Bestseller at ${name}`,
        tag: 'BESTSELLER',
        product: defaultProd || 'Bestselling Products',
        style: 'photorealistic'
      },
    ]
  }

  const dynamicPresets = getDynamicPresets()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="AI Creative Media Studio"
        subtitle={`Generate commercial marketing posters, social media visuals, and short-form video reels tailored specifically for ${activeBusiness.business_name}.`}
        badge="Grounded in Your Business"
      />

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

      {/* Main Studio Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('images')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'images'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon size={16} className="text-primary-600" />
          <span>Marketing Posters &amp; Images</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'videos'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Film size={16} className="text-rose-500" />
          <span>Reels &amp; Video Commercials</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 1: AI MARKETING POSTERS & IMAGES */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'images' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="card shadow-card space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Palette size={16} className="text-primary-600" />
                <h2 className="text-sm font-bold text-slate-900">Visual Composer</h2>
              </div>

              {/* Quick Preset Ideas */}
              <div>
                <label className="label mb-1.5">Industry-Tailored Inspirations ({activeBusiness.business_type})</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {dynamicPresets.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setImgPrompt(p.prompt)
                        setImgDiscountTag(p.tag)
                        if (p.headline) setImgHeadline(p.headline)
                        if (p.product) setImgProduct(p.product)
                        if (p.style) setImgStyle(p.style)
                      }}
                      className="p-2 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-primary-50/50 hover:border-primary-200 text-left transition-all group"
                    >
                      <span className="text-[11px] font-bold text-slate-800 block group-hover:text-primary-700">{p.label}</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-primary-600 font-semibold">{p.tag}</span>
                        <span className="text-[9px] text-slate-400 capitalize">{p.style?.replace('_', ' ')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product / Subject */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Product or Offer Focus</label>
                  {productsList.length > 0 && (
                    <span className="text-[10px] text-slate-400">From catalog:</span>
                  )}
                </div>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Signature Cold Brew, Handcrafted Leather Bag"
                  value={imgProduct}
                  onChange={e => setImgProduct(e.target.value)}
                />
                {productsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {productsList.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setImgProduct(p.name)
                          if (!imgHeadline) setImgHeadline(`Premium ${p.name}`)
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                          imgProduct === p.name
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

              {/* Custom Prompt */}
              <div>
                <label className="label">Visual Scene Prompt</label>
                <textarea
                  className="input text-xs h-20 resize-none"
                  placeholder="Describe the background, lighting, props, and overall scene vibe..."
                  value={imgPrompt}
                  onChange={e => setImgPrompt(e.target.value)}
                />
              </div>

              {/* Style Selector */}
              <div>
                <label className="label">Visual Aesthetic &amp; Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setImgStyle(s.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        imgStyle === s.id
                          ? 'border-primary-600 bg-primary-50/70 ring-1 ring-primary-500/20'
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold ${imgStyle === s.id ? 'text-primary-800' : 'text-slate-800'}`}>
                          {s.label}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-bold">
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="label">Aspect Ratio</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ASPECT_RATIOS.map(ar => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setImgAspectRatio(ar.id)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        imgAspectRatio === ar.id
                          ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">{ar.label}</span>
                      <span className="text-[9px] text-slate-400 block truncate">{ar.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Overlays / Badges */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="label">Poster Headline</label>
                  <input
                    type="text"
                    className="input text-xs"
                    placeholder="e.g. Summer Mega Sale"
                    value={imgHeadline}
                    onChange={e => setImgHeadline(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Promo Badge</label>
                  <input
                    type="text"
                    className="input text-xs"
                    placeholder="e.g. Flat 30% OFF"
                    value={imgDiscountTag}
                    onChange={e => setImgDiscountTag(e.target.value)}
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateImage}
                disabled={imgLoading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-2"
              >
                {imgLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Rendering Visual with AI…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate AI Marketing Poster</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Column (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {imgLoading && (
              <div className="card p-16 text-center shadow-card">
                <LoadingSpinner message="Generating high-definition commercial poster with AI lighting & staging…" />
              </div>
            )}

            {!imgLoading && !generatedImage && (
              <div className="card border-dashed border-2 border-slate-200 text-center py-20 px-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-50 to-indigo-50 border border-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                  <ImageIcon size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Visual Studio Canvas Empty</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
                  Choose your product, pick an aesthetic style, and click Generate to create instant commercial-grade advertising posters ready for Instagram &amp; Facebook.
                </p>
                <button onClick={handleGenerateImage} className="btn-primary">
                  <Sparkles size={14} className="mr-1.5" /> Generate Sample Poster
                </button>
              </div>
            )}

            {!imgLoading && generatedImage && (
              <div className="card shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs">
                      AI
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Generated Commercial Poster</h3>
                      <p className="text-[11px] text-slate-400 capitalize">{generatedImage.style?.replace('_', ' ')} • {generatedImage.aspect_ratio}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadImage}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      <span>Download Poster</span>
                    </button>
                  </div>
                </div>

                {/* Poster Display Mockup */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-lg group">
                  <div className="flex justify-center items-center bg-slate-900/40 p-2">
                    <img
                      src={generatedImage.image_url}
                      alt="Generated Poster"
                      className={`w-full max-h-[480px] object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.01] ${
                        generatedImage.aspect_ratio === '9:16' ? 'max-w-xs mx-auto aspect-[9/16]' :
                        generatedImage.aspect_ratio === '16:9' ? 'aspect-video' :
                        'aspect-square max-w-md mx-auto'
                      }`}
                    />
                  </div>

                  {/* Dynamic Graphic Typography Overlay (Poster Badge & Headline) */}
                  {(generatedImage.headline || generatedImage.discount_tag) && (
                    <div className="absolute inset-x-4 bottom-4 p-4 rounded-xl bg-slate-950/75 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
                      <div>
                        {generatedImage.discount_tag && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider mb-1">
                            {generatedImage.discount_tag}
                          </span>
                        )}
                        <h4 className="text-sm sm:text-base font-extrabold tracking-tight text-white drop-shadow-xs">
                          {generatedImage.headline}
                        </h4>
                        <p className="text-[11px] text-slate-300 font-medium">
                          {generatedImage.business_name}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Ready to Post</span>
                        <span className="text-xs font-bold text-emerald-400">High-Res HDR</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prompt Details & Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-700 block mb-1">Production Details:</span>
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      <li>• <strong>Camera:</strong> {generatedImage.camera_meta?.lens || '85mm f/1.4 Art'}</li>
                      <li>• <strong>Lighting:</strong> {generatedImage.camera_meta?.lighting || 'Diffused Softbox'}</li>
                      <li>• <strong>Engine:</strong> {generatedImage.source === 'gemini_imagen' ? 'Google Gemini Imagen 3' : 'Smart Commercial Studio'}</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Ready-to-Use Caption Hook:</span>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{generatedImage.caption_snippet}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedImage.caption_snippet, 'img-caption')}
                      className="mt-2 text-[11px] text-primary-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      {copiedKey === 'img-caption' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === 'img-caption' ? 'Copied' : 'Copy Accompanying Caption'}</span>
                    </button>
                  </div>
                </div>

                {/* Hashtags */}
                {generatedImage.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {generatedImage.hashtags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 2: AI REELS & VIDEO COMMERCIALS */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="card shadow-card space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Clapperboard size={16} className="text-rose-500" />
                <h2 className="text-sm font-bold text-slate-900">Commercial Reel Producer</h2>
              </div>

              {/* Video Objective Type */}
              <div>
                <label className="label">Reel Format &amp; Style</label>
                <div className="space-y-1.5">
                  {VIDEO_TYPES.map(vt => (
                    <div
                      key={vt.id}
                      onClick={() => setVidType(vt.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        vidType === vt.id
                          ? 'border-rose-500 bg-rose-50/60 ring-1 ring-rose-500/20'
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <p className={`text-xs font-bold ${vidType === vt.id ? 'text-rose-800' : 'text-slate-800'}`}>
                        {vt.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{vt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Product */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Star Product or Theme</label>
                  {productsList.length > 0 && (
                    <span className="text-[10px] text-slate-400">Select product:</span>
                  )}
                </div>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Handmade Sourdough, Artisan Coffee, Festive Collection"
                  value={vidProduct}
                  onChange={e => setVidProduct(e.target.value)}
                />
                {productsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {productsList.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setVidProduct(p.name)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                          vidProduct === p.name
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Duration & Target Platform */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duration</label>
                  <select
                    className="input text-xs"
                    value={vidDuration}
                    onChange={e => setVidDuration(Number(e.target.value))}
                  >
                    <option value={15}>15s (Viral Reel / TikTok)</option>
                    <option value={30}>30s (Promo Commercial)</option>
                    <option value={60}>60s (Full Story Video)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Target Platform</label>
                  <select
                    className="input text-xs"
                    value={vidPlatform}
                    onChange={e => setVidPlatform(e.target.value)}
                  >
                    <option value="instagram_reels">Instagram Reels (9:16)</option>
                    <option value="tiktok">TikTok (9:16)</option>
                    <option value="youtube_shorts">YouTube Shorts (9:16)</option>
                    <option value="facebook_video">Facebook Video (16:9)</option>
                  </select>
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="label">Vibe &amp; Audio Energy</label>
                <select
                  className="input text-xs"
                  value={vidTone}
                  onChange={e => setVidTone(e.target.value)}
                >
                  <option value="High-Energy & Trendy">High-Energy &amp; Trendy (Fast cuts, bass drops)</option>
                  <option value="Cinematic & Luxurious">Cinematic &amp; Luxurious (Slow motion, elegant piano)</option>
                  <option value="Warm & Friendly">Warm &amp; Friendly (Authentic local community feel)</option>
                  <option value="Urgent Flash Sale">Urgent Flash Sale (Bold typography countdown)</option>
                </select>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="label">Campaign Concept Notes</label>
                <textarea
                  className="input text-xs h-18 resize-none"
                  placeholder="e.g. Focus on our fresh organic sourcing and offer flat ₹100 off on first orders..."
                  value={vidPrompt}
                  onChange={e => setVidPrompt(e.target.value)}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateVideo}
                disabled={vidLoading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white mt-2"
              >
                {vidLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Directing Reel &amp; Voiceover with AI…</span>
                  </>
                ) : (
                  <>
                    <Film size={14} />
                    <span>Generate AI Reel Storyboard</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Player & Storyboard (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {vidLoading && (
              <div className="card p-16 text-center shadow-card">
                <LoadingSpinner message="Composing scene-by-scene script, kinetic text overlays & audio design…" />
              </div>
            )}

            {!vidLoading && !generatedVideo && (
              <div className="card border-dashed border-2 border-slate-200 text-center py-20 px-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-50 to-amber-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                  <Film size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Reel Studio Ready</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
                  Configure your video style and duration to generate complete 15s/30s commercial reels with scene-by-scene kinetic text, voiceovers, and camera direction.
                </p>
                <button onClick={handleGenerateVideo} className="btn-primary bg-rose-600 hover:bg-rose-700 text-white">
                  <Sparkles size={14} className="mr-1.5" /> Generate Sample Video Reel
                </button>
              </div>
            )}

            {!vidLoading && generatedVideo && (
              <div className="space-y-5">
                {/* 🎬 KINETIC REEL PREVIEW PLAYER */}
                <div className="card shadow-card p-5 space-y-4 bg-slate-900 text-white border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs">{generatedVideo.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-rose-400 border border-slate-700">
                      {generatedVideo.duration_seconds}s Reel • 9:16 Vertical
                    </span>
                  </div>

                  {/* Phone Simulator Frame */}
                  <div className="relative mx-auto w-full max-w-xs aspect-[9/16] rounded-3xl overflow-hidden bg-black border-4 border-slate-800 shadow-2xl flex flex-col justify-between">
                    {/* Scene Visual Background */}
                    {generatedVideo.scenes?.[currentSceneIdx] && (
                      <img
                        src={generatedVideo.scenes[currentSceneIdx].preview_image}
                        alt="Scene Background"
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 brightness-90"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                    {/* Top Status & Segment Progress Bars */}
                    <div className="relative z-10 p-3 space-y-2">
                      {/* Instagram Stories Style Segments */}
                      <div className="flex items-center gap-1">
                        {generatedVideo.scenes?.map((_, idx) => (
                          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white transition-all duration-100"
                              style={{
                                width: idx < currentSceneIdx ? '100%' :
                                       idx === currentSceneIdx ? `${playbackProgress}%` : '0%'
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-white/80 font-semibold">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-white" />
                          {activeBusiness.business_name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs">
                          Scene {currentSceneIdx + 1} of {generatedVideo.scenes?.length}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Kinetic On-Screen Typography */}
                    <div className="relative z-10 p-4 text-center my-auto">
                      {generatedVideo.scenes?.[currentSceneIdx] && (
                        <div className="space-y-2 animate-fade-in">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider shadow-md">
                            {generatedVideo.scenes[currentSceneIdx].phase}
                          </span>
                          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                            {generatedVideo.scenes[currentSceneIdx].on_screen_text}
                          </h2>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Voiceover Subtitle & Camera Move Tag */}
                    <div className="relative z-10 p-4 space-y-2">
                      {generatedVideo.scenes?.[currentSceneIdx] && (
                        <div className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-left">
                          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold mb-0.5">
                            <Volume2 size={11} /> Voiceover Narration:
                          </div>
                          <p className="text-[11px] text-slate-200 leading-snug">
                            "{generatedVideo.scenes[currentSceneIdx].voiceover}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                      >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        <span>{isPlaying ? 'Pause Reel' : 'Play Interactive Reel'}</span>
                      </button>

                      <button
                        onClick={() => setIsVoiceoverMuted(!isVoiceoverMuted)}
                        className={`p-2 rounded-xl border text-xs transition-all ${
                          isVoiceoverMuted
                            ? 'border-slate-700 bg-slate-800 text-slate-400'
                            : 'border-slate-700 bg-slate-800 text-rose-400'
                        }`}
                        title={isVoiceoverMuted ? 'Voiceover narration muted' : 'Voiceover narration active'}
                      >
                        {isVoiceoverMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>
                    </div>

                    {/* Scene Stepper */}
                    <div className="flex items-center gap-1">
                      {generatedVideo.scenes?.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentSceneIdx(idx)
                            setPlaybackProgress(0)
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            currentSceneIdx === idx
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Vibe Guide */}
                  {generatedVideo.music_track && (
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music size={14} className="text-rose-400" />
                        <div>
                          <span className="font-bold text-white block">{generatedVideo.music_track.title}</span>
                          <span className="text-[10px] text-slate-400">{generatedVideo.music_track.vibe}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-rose-400">{generatedVideo.music_track.bpm} BPM</span>
                    </div>
                  )}
                </div>

                {/* 📋 SCENE-BY-SCENE STORYBOARD CARDS */}
                <div className="card shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Commercial Storyboard &amp; Script Breakdown</h3>
                      <p className="text-[11px] text-slate-400">Complete visual shots, kinetic text, and camera cues</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedVideo.full_voiceover_script, 'full-vo')}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      {copiedKey === 'full-vo' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'full-vo' ? 'Copied' : 'Copy Full Script'}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {generatedVideo.scenes?.map((sc, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setCurrentSceneIdx(i)
                          setPlaybackProgress(0)
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          currentSceneIdx === i
                            ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20'
                            : 'border-slate-200/80 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                              {sc.scene_number}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{sc.phase}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {sc.duration}s duration
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Camera &amp; Visuals:</span>
                            <p className="text-slate-700 text-[11px]">{sc.visual_description}</p>
                            <p className="text-slate-500 text-[10px] mt-1">🎥 {sc.camera_motion} • {sc.transition}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Voiceover &amp; Typography:</span>
                            <p className="text-slate-800 text-[11px] font-medium">"{sc.voiceover}"</p>
                            <p className="text-rose-600 font-bold text-[10px] mt-1">Text: "{sc.on_screen_text}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Veo 3.1 Prompt Export Box */}
                  {generatedVideo.veo_generation_prompt && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Sparkles size={12} className="text-primary-600" />
                          Google Veo 3.1 Ready Video Prompt
                        </span>
                        <button
                          onClick={() => copyToClipboard(generatedVideo.veo_generation_prompt, 'veo-prompt')}
                          className="text-[11px] font-semibold text-primary-600 hover:underline"
                        >
                          {copiedKey === 'veo-prompt' ? 'Copied!' : 'Copy Prompt'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono bg-white p-2.5 rounded-lg border border-slate-200/80">
                        {generatedVideo.veo_generation_prompt}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
