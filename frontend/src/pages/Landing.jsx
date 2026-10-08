import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store, BarChart2, Brain, Upload, TrendingUp,
  MessageSquare, FlaskConical, FileText, ArrowRight,
  CheckCircle, Sparkles, ShieldCheck, Zap, LineChart,
  Layers, ShoppingBag, ArrowUpRight, Share2
} from 'lucide-react'

const FEATURES = [
  {
    icon: Upload,
    title: 'Multimodal Data Ingestion',
    desc: 'Drop CSV/Excel spreadsheets, scan raw camera photos of paper bills using OCR, or dictate transactions in natural language.',
    tag: 'OCR & NLP'
  },
  {
    icon: BarChart2,
    title: 'Real-Time Financial Telemetry',
    desc: 'Live revenue & expense trajectories, real-time margins, inventory health monitors, and automated rank matrices.',
    tag: 'Telemetry'
  },
  {
    icon: Brain,
    title: 'Deterministic AI Reasoning',
    desc: 'The backend calculates exact mathematical facts from your database first; the LLM then synthesizes plain-English strategic guidance.',
    tag: 'Zero Hallucinations'
  },
  {
    icon: TrendingUp,
    title: 'ML-Powered Sales Forecasting',
    desc: 'Trained linear-regression algorithms project 7-day sales demand based on rolling weighted historical patterns.',
    tag: 'Machine Learning'
  },
  {
    icon: FlaskConical,
    title: 'What-If Margin Simulator',
    desc: 'Simulate price changes or operational expense shifts before committing in the real world with immediate profit projections.',
    tag: 'Simulation'
  },
  {
    icon: MessageSquare,
    title: 'Conversational Business Copilot',
    desc: 'Chat directly with your business data. Ask "Why did profit decline on Tuesday?" and get answers grounded in real line items.',
    tag: 'Natural Language'
  },
  {
    icon: Share2,
    title: 'AI Social Media Content Studio',
    desc: 'Generate platform-tailored captions, viral hashtags, compelling CTAs, and ad copy for Instagram, Facebook, WhatsApp, and LinkedIn.',
    tag: 'Marketing'
  },
  {
    icon: FileText,
    title: 'Executive PDF Dossiers',
    desc: 'Generate complete boardroom-grade PDF reports with charts, forecasts, and prioritized action plans with a single click.',
    tag: '1-Click Reports'
  },
  {
    icon: Store,
    title: 'Business Agnostic Architecture',
    desc: 'Pre-tuned workflows for supermarkets, fashion boutiques, dining establishments, and hardware retail stores.',
    tag: 'Universal'
  },
]

const STATS = [
  { value: '100%', label: 'Deterministic Accuracy', sub: 'No fabricated calculations' },
  { value: '< 2.5s', label: 'OCR & Parsing Speed', sub: 'Instant receipt digitization' },
  { value: '7-Day', label: 'Predictive Horizons', sub: 'Adaptive regression modeling' },
  { value: 'Zero', label: 'Accounting Expertise', sub: 'Built for busy business owners' },
]

const SUPPORTED = ['Supermarkets & Groceries', 'Fashion & Apparel', 'Cafes & Dining', 'Specialty Retail', 'Electronics & Hardware']

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-500 selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-700 via-primary-600 to-primary-500 flex items-center justify-center shadow-md shadow-primary-500/20">
              <Store size={19} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">AI Assistant</span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary-100 text-primary-700 uppercase">PRO</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary"
            >
              Get Started Free <ArrowRight size={14} className="ml-1.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Ambient background glow and grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200/80 shadow-xs px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
            <span>Next-Gen Autonomous AI Operations Engine</span>
            <span className="text-slate-300">|</span>
            <span className="text-primary-600 font-bold">Local &amp; Secure</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            Run your small business with <br />
            <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              autonomous AI intelligence
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            No spreadsheets, no manual ledger math. Digitize invoices with OCR, forecast weekly customer demand, and receive plain-English strategic guidance from your database.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-sm px-7 py-3.5 w-full sm:w-auto shadow-lg shadow-primary-500/20"
            >
              Launch Your Dashboard <ArrowRight size={16} className="ml-2" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-sm px-7 py-3.5 w-full sm:w-auto"
            >
              Explore with Demo Credentials
            </button>
          </div>

          {/* Supported niches */}
          <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-400 mr-2 uppercase tracking-wider">Engineered for:</span>
            {SUPPORTED.map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                <CheckCircle size={13} className="text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Product Preview Visual Mockup Frame ── */}
        <div className="relative max-w-5xl mx-auto px-6 mt-14">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5">
            {/* Mock browser header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono text-slate-400">app.aibusinessassistant.io/dashboard</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
              </span>
            </div>

            {/* Mock Dashboard Interior */}
            <div className="p-4 sm:p-6 bg-slate-50/50 rounded-b-xl space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div>
                  <h3 className="text-base font-bold text-slate-900">GreenLeaf Grocers — Operations Dashboard</h3>
                  <p className="text-xs text-slate-400">Retail Grocery · Currency: ₹ (INR)</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-100 text-primary-700">
                  7-Day Horizon
                </span>
              </div>

              {/* KPI Mock Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Gross Revenue</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">₹4,82,500</p>
                  <span className="text-[10px] font-bold text-emerald-600">↑ +14.2% vs prev</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Expenses</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">₹1,94,200</p>
                  <span className="text-[10px] font-bold text-slate-400">Normalized</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Net Margin (Est.)</p>
                  <p className="text-xl font-extrabold text-emerald-600 mt-0.5">₹2,88,300</p>
                  <span className="text-[10px] font-bold text-emerald-600">59.7% margin</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">AI Recommendation</p>
                  <p className="text-xs font-bold text-primary-700 mt-1">Restock Basmati Rice</p>
                  <span className="text-[10px] text-amber-600 font-semibold">Stockout in 3 days</span>
                </div>
              </div>

              {/* Mock AI Insight banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <p className="text-xs text-slate-200 leading-snug">
                    <strong className="text-white">AI Copilot Analysis:</strong> Friday evening sales increased by 28% due to Dairy &amp; Bakery combo purchases. We recommend increasing Bakery order volume for the upcoming weekend.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs font-bold bg-white text-slate-900 rounded-lg hover:bg-slate-100 shrink-0"
                >
                  Try Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Metrics Bar ── */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="py-20 lg:py-28 max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Everything your operations team needs
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            An all-in-one suite bridging the gap between physical receipts, business databases, and strategic artificial intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 border border-primary-100 flex items-center justify-center">
                    <f.icon size={20} />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-slate-100/70 border-y border-slate-200/80 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">How It Works</h2>
            <p className="text-slate-500 text-sm">Three friction-free steps from raw inputs to boardroom insights.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Capture Ingestion',
                desc: 'Upload a batch CSV, photograph paper supplier invoices with your mobile camera, or write sentences like "Sold 4 shirts for ₹3200".'
              },
              {
                step: '02',
                title: 'Deterministic Engine',
                desc: 'Python & SQLite parse, validate, and compute exact accounting numbers, gross margins, inventory balance, and rolling averages.'
              },
              {
                step: '03',
                title: 'AI Synthesis',
                desc: 'Gemini / Claude inspects the pre-computed mathematical truth to generate actionable prioritized guidance and weekly forecasts.'
              },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative flex flex-col">
                <span className="text-3xl font-black text-primary-200 mb-2">{s.step}</span>
                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action ── */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="rounded-3xl bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-700 p-8 sm:p-14 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
            Ready to upgrade your business operations?
          </h2>
          <p className="text-primary-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Get instant access to real-time dashboards, OCR bill scanning, and AI forecasts in less than two minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/register')}
              className="px-7 py-3.5 rounded-xl font-bold text-sm bg-white text-primary-700 hover:bg-primary-50 shadow-md transition-all active:scale-95"
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-3.5 rounded-xl font-semibold text-sm bg-primary-800/60 hover:bg-primary-800 text-white border border-primary-400/40 transition-all"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        <p>© 2026 AI Business Assistant Platform · Autonomous Operations &amp; Deterministic Intelligence.</p>
      </footer>
    </div>
  )
}
