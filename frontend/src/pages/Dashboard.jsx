import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingCart,
  AlertTriangle, RefreshCw, Database, Sparkles, PlusCircle,
  FileSpreadsheet, ArrowRight, ArrowUpRight, Flame, Layers, Share2,
  Upload, ArrowLeftRight, Package, Receipt, Calendar, FlaskConical, MessageSquare
} from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import KPICard from '../components/KPICard'
import PageHeader from '../components/PageHeader'
import NoBusiness from '../components/NoBusiness'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6']

const fmt = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0)

const fmtShort = (n) => {
  if (n >= 100000) return `${(n/100000).toFixed(1)}L`
  if (n >= 1000)   return `${(n/1000).toFixed(1)}K`
  return n?.toFixed(0) ?? '0'
}

// Custom Tooltip for charts
function CustomChartTooltip({ active, payload, label, currency = 'INR' }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/60 text-xs space-y-1">
      <p className="font-bold text-slate-300 pb-1 border-b border-slate-700/60">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-slate-300">{entry.name}:</span>
          </div>
          <span className="font-bold text-white">{fmt(entry.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { activeBusiness } = useBusiness()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState(30)
  const [aiInsight, setAiInsight] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const fetchDashboard = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const r = await api.get(`/businesses/${activeBusiness.id}/analytics/dashboard?period_days=${period}`)
      setData(r.data)
    } catch (err) {
      console.error('Dashboard fetch failed', err)
    } finally {
      setLoading(false)
    }
  }, [activeBusiness, period])

  const fetchAI = useCallback(async () => {
    if (!activeBusiness) return
    setAiLoading(true)
    try {
      const r = await api.get(`/businesses/${activeBusiness.id}/ai/insights?period_days=${period}`)
      setAiInsight(r.data.insights)
    } catch (err) {
      console.error('AI insights failed', err)
    } finally {
      setAiLoading(false)
    }
  }, [activeBusiness, period])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (!activeBusiness) return <NoBusiness />
  if (loading) return <LoadingSpinner message="Calculating real-time analytics..." />

  const s = data?.summary
  const currency = activeBusiness.currency || 'INR'
  const hasData = s && s.num_transactions > 0

  // Prepare charts
  const dailySales = (data?.daily_sales || []).map(d => ({
    date: d.date.slice(5),
    Sales: d.amount,
  }))
  const dailyExpenses = (data?.daily_expenses || []).map(d => ({
    date: d.date.slice(5),
    Expenses: d.amount,
  }))

  const combinedMap = {}
  dailySales.forEach(d => { combinedMap[d.date] = { date: d.date, Sales: d.Sales, Expenses: 0 } })
  dailyExpenses.forEach(d => {
    if (combinedMap[d.date]) combinedMap[d.date].Expenses = d.Expenses
    else combinedMap[d.date] = { date: d.date, Sales: 0, Expenses: d.Expenses }
  })
  const combined = Object.values(combinedMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-60)

  const categoryData = data?.sales_by_category || []
  const topProducts  = data?.top_products || []
  const lowStock     = data?.low_stock || []

  // Derived margin
  const profitMargin = s?.total_revenue > 0
    ? ((s.estimated_profit / s.total_revenue) * 100).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      {/* ── Top Header with Period Pills & Quick Actions ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Operations Overview
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
              Live DB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time financial performance and automated inventory tracking for <span className="font-semibold text-slate-700">{activeBusiness.business_name}</span>.
          </p>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-slate-200/60 rounded-xl">
            {[
              { label: '7D', value: 7 },
              { label: '30D', value: 30 },
              { label: '90D', value: 90 },
            ].map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  period === p.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboard}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-all"
            title="Refresh dashboard"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Feature Hub Navigation Cards ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers size={16} className="text-primary-600" />
            <span>Application Features Hub</span>
          </h2>
          <span className="text-[11px] font-medium text-slate-400">10 Direct Feature Modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Data Input & OCR */}
          <div
            onClick={() => navigate('/app/data-input')}
            className="card shadow-card p-3.5 hover:border-primary-400 hover:shadow-md cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700">Import</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">Data Input &amp; OCR</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">CSV/Excel upload, image scan &amp; text entry</p>
            </div>
          </div>

          {/* 2. Transactions */}
          <div
            onClick={() => navigate('/app/transactions')}
            className="card shadow-card p-3.5 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowLeftRight size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">Ledger</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Transactions Log</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Sales &amp; purchase ledger management</p>
            </div>
          </div>

          {/* 3. Products */}
          <div
            onClick={() => navigate('/app/products')}
            className="card shadow-card p-3.5 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700">Stock</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Inventory &amp; Products</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Catalog prices &amp; reorder alerts</p>
            </div>
          </div>

          {/* 4. Expenses */}
          <div
            onClick={() => navigate('/app/expenses')}
            className="card shadow-card p-3.5 hover:border-rose-400 hover:shadow-md cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700">Expenses</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">Expenses</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Track operational costs &amp; categories</p>
            </div>
          </div>

          {/* 5. Sales Forecast */}
          <div
            onClick={() => navigate('/app/forecast')}
            className="card shadow-card p-3.5 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700">Predictive</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Sales Forecast</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">7-day ML revenue predictions</p>
            </div>
          </div>

          {/* 6. AI Insights */}
          <div
            onClick={() => navigate('/app/ai-insights')}
            className="card shadow-card p-3.5 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700">Analytics AI</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">AI Insights</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Health checks &amp; action plan</p>
            </div>
          </div>

          {/* 7. AI Campaign Planner */}
          <div
            onClick={() => navigate('/app/campaign-planner')}
            className="card shadow-card p-3.5 hover:border-primary-500 hover:shadow-md cursor-pointer transition-all space-y-2 group border-primary-200/80 bg-gradient-to-br from-primary-50/40 to-white"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Calendar size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-primary-600 text-white uppercase">New</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-primary-700 transition-colors">AI Campaign Planner</h3>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Multi-day marketing strategy &amp; calendar</p>
            </div>
          </div>

          {/* 8. Social Content Studio */}
          <div
            onClick={() => navigate('/app/social-generator')}
            className="card shadow-card p-3.5 hover:border-rose-400 hover:shadow-md cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Share2 size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700">Studio</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">Social Content Studio</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Multi-channel captions &amp; ad copy</p>
            </div>
          </div>

          {/* 9. What-If Simulator */}
          <div
            onClick={() => navigate('/app/whatif')}
            className="card shadow-card p-3.5 hover:border-teal-400 hover:shadow-md cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FlaskConical size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-50 text-teal-700">Simulator</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">What-If Simulator</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Price &amp; expense scenario modeling</p>
            </div>
          </div>

          {/* 10. Ask AI Assistant */}
          <div
            onClick={() => navigate('/app/ask-ai')}
            className="card shadow-card p-3.5 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all space-y-2 group bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare size={17} />
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/20 text-indigo-200">AI Chat</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-primary-300 transition-colors">Ask AI Assistant</h3>
              <p className="text-[11px] text-indigo-200 leading-snug mt-0.5">Interactive Q&amp;A on your real business data</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── No data state ── */}
      {!hasData && !loading && (
        <div className="card border-dashed border-2 border-slate-200 text-center py-12">
          <EmptyState
            title="No business transactions found"
            message="Import your sales data or load demo transactions to visualize real-time charts and unlock AI operations insights."
            action="/app/data-input"
            actionLabel="Import Data / Load Demo"
            icon={Database}
          />
        </div>
      )}

      {hasData && (
        <>
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Revenue"
              value={s.total_revenue}
              prefix={currency === 'INR' ? '₹' : '$'}
              change={s.sales_growth_pct}
              changeLabel="vs previous period"
              icon={DollarSign}
              color="blue"
            />
            <KPICard
              title="Total Expenses"
              value={s.total_expenses}
              prefix={currency === 'INR' ? '₹' : '$'}
              change={s.expense_growth_pct}
              changeLabel="vs previous period"
              icon={TrendingDown}
              color="red"
            />
            <KPICard
              title={`Net Profit${s.profit_is_estimate ? ' (Est.)' : ''}`}
              value={s.estimated_profit}
              prefix={currency === 'INR' ? '₹' : '$'}
              change={profitMargin ? Number(profitMargin) : null}
              changeLabel="net margin"
              icon={TrendingUp}
              color={s.estimated_profit >= 0 ? 'green' : 'red'}
            />
            <KPICard
              title="Total Transactions"
              value={s.num_transactions}
              change={s.avg_transaction_value ? null : null}
              changeLabel={`Avg ₹${Math.round(s.avg_transaction_value || 0)}`}
              icon={ShoppingCart}
              color="purple"
            />
          </div>

          {/* ── AI Executive Briefing Banner ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-primary-500/10 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-glow-primary">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight text-white">AI Operations Briefing</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-500/30 text-primary-200 border border-primary-400/30">
                      Deterministic Facts
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {aiInsight
                      ? aiInsight.summary
                      : `Your revenue sits at ${fmt(s.total_revenue, currency)} over the last ${period} days with ${s.num_transactions} logged transactions. Click Generate to produce automated operational guidance.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={fetchAI}
                  disabled={aiLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles size={13} className="text-primary-600" />
                  {aiLoading ? 'Synthesizing…' : (aiInsight ? 'Refresh Briefing' : 'Generate Briefing')}
                </button>
                <button
                  onClick={() => navigate('/app/ai-insights')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>

          {/* ── Revenue & Expense Trend Chart ── */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Revenue &amp; Expense Velocity</h3>
                <p className="text-xs text-slate-500">Daily financial trajectory comparing gross intake vs overhead</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary-500"></span>
                  <span className="text-slate-600">Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                  <span className="text-slate-600">Expenses</span>
                </div>
              </div>
            </div>

            {combined.length < 3 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Need at least 3 days of transaction data to generate a multi-day velocity curve.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={combined} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                  <Tooltip content={<CustomChartTooltip currency={currency} />} />
                  <Area type="monotone" dataKey="Sales" stroke="#4f46e5" strokeWidth={2.5} fill="url(#gSales)" />
                  <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gExp)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Two-column: Category Breakdown & Top Products ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sales by category */}
            <div className="card flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">Revenue Contribution by Category</h3>
                <p className="text-xs text-slate-500">Distribution across product lines</p>
              </div>

              {categoryData.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No categorized sales in this period.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2 text-xs">
                    {categoryData.slice(0, 5).map((cat, i) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-slate-600 truncate font-medium">{cat.category}</span>
                        </div>
                        <span className="font-bold text-slate-800">{fmt(cat.total, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top products ranking */}
            <div className="card flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">Top Revenue Generators</h3>
                <p className="text-xs text-slate-500">Ranked by volume and gross proceeds</p>
              </div>

              {topProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No product revenue data recorded.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topProducts.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip content={<CustomChartTooltip currency={currency} />} />
                    <Bar dataKey="total_revenue" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Low Stock Monitor & Full Top Products Table ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Low stock alerts (1 col) */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Inventory Watchlist</h3>
                    <p className="text-[11px] text-slate-400">Items nearing replenishment limit</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/app/products')}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Manage
                </button>
              </div>

              {lowStock.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50/50 border border-slate-100">
                  <p className="text-xs font-medium text-emerald-600">✓ Healthy Stock Levels</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All inventory counts are above safety thresholds.</p>
                </div>
              ) : (
                <div className="space-y-2 mt-3">
                  {lowStock.map(p => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500">Safety mark: {p.reorder_level} {p.unit || 'units'}</p>
                      </div>
                      <span className="badge-high text-[11px]">
                        {p.current_stock} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top products table (2 cols) */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Product Performance Matrix</h3>
                  <p className="text-xs text-slate-500">Unit breakdown and income volume</p>
                </div>
                <button
                  onClick={() => navigate('/app/products')}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  View All <ArrowRight size={13} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-left">
                      <th className="pb-2.5 pl-1">Rank</th>
                      <th className="pb-2.5">Product Name</th>
                      <th className="pb-2.5 text-right">Qty Delivered</th>
                      <th className="pb-2.5 text-right pr-1">Total Turnover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {topProducts.length === 0 ? (
                      <tr><td colSpan={4} className="py-6 text-center text-slate-400">No transactions recorded yet</td></tr>
                    ) : topProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 pl-1">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px] ${
                            i === 0 ? 'bg-amber-100 text-amber-800' :
                            i === 1 ? 'bg-slate-200 text-slate-700' :
                            i === 2 ? 'bg-orange-100 text-orange-800' : 'text-slate-400'
                          }`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-800">{p.product_name}</td>
                        <td className="py-2.5 text-right text-slate-600 font-medium">{p.total_quantity?.toLocaleString()}</td>
                        <td className="py-2.5 text-right pr-1 font-bold text-slate-900">{fmt(p.total_revenue, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
