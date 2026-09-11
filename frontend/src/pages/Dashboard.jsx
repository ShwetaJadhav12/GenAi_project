import React, { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingCart,
  AlertTriangle, RefreshCw, Database,
} from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import KPICard from '../components/KPICard'
import PageHeader from '../components/PageHeader'
import NoBusiness from '../components/NoBusiness'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const COLORS = ['#3b82f6','#14b8a6','#f59e0b','#ef4444','#8b5cf6','#10b981','#f97316','#06b6d4']

const fmt = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

const fmtShort = (n) => {
  if (n >= 100000) return `${(n/100000).toFixed(1)}L`
  if (n >= 1000)   return `${(n/1000).toFixed(1)}K`
  return n?.toFixed(0) ?? '0'
}

export default function Dashboard() {
  const { activeBusiness } = useBusiness()
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
  if (loading) return <LoadingSpinner message="Loading dashboard…" />

  const s = data?.summary
  const currency = activeBusiness.currency || 'INR'
  const hasData = s && s.num_transactions > 0

  // Prepare charts
  const dailySales = (data?.daily_sales || []).map(d => ({
    date: d.date.slice(5),   // MM-DD
    Sales: d.amount,
  }))
  const dailyExpenses = (data?.daily_expenses || []).map(d => ({
    date: d.date.slice(5),
    Expenses: d.amount,
  }))
  // Merge sales + expenses by date for combined chart
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
  const recentTx     = [] // loaded separately if needed

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${activeBusiness.business_name} — Dashboard`}
        subtitle={`${activeBusiness.business_type} · ${activeBusiness.currency}`}
        actions={
          <div className="flex items-center gap-2">
            <select
              className="input w-auto text-sm"
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={fetchDashboard} className="btn-secondary flex items-center gap-1.5 text-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        }
      />

      {/* No data state */}
      {!hasData && !loading && (
        <div className="card border-dashed border-2 border-gray-200">
          <EmptyState
            title="No transaction data yet"
            message="Load demo data or add transactions to see your dashboard come alive."
            action="/app/data-input"
            actionLabel="Add Data"
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
              changeLabel="vs prev period"
              icon={DollarSign}
              color="blue"
            />
            <KPICard
              title="Total Expenses"
              value={s.total_expenses}
              prefix={currency === 'INR' ? '₹' : '$'}
              change={s.expense_growth_pct}
              changeLabel="vs prev period"
              icon={TrendingDown}
              color="red"
            />
            <KPICard
              title={`Est. Profit${s.profit_is_estimate ? ' *' : ''}`}
              value={s.estimated_profit}
              prefix={currency === 'INR' ? '₹' : '$'}
              icon={TrendingUp}
              color={s.estimated_profit >= 0 ? 'green' : 'red'}
            />
            <KPICard
              title="Transactions"
              value={s.num_transactions}
              icon={ShoppingCart}
              color="purple"
            />
          </div>
          {s.profit_is_estimate && (
            <p className="text-xs text-amber-600 -mt-2">
              * Profit is estimated (revenue − expenses). Add cost prices for a more accurate figure.
            </p>
          )}

          {/* ── Revenue + Expense Trend ── */}
          <div className="card">
            <h3 className="mb-4">Revenue &amp; Expense Trend (last 60 days)</h3>
            {combined.length < 3 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Not enough data for a trend chart yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={combined}>
                  <defs>
                    <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip formatter={(v) => fmt(v, currency)} />
                  <Legend />
                  <Area type="monotone" dataKey="Sales"    stroke="#3b82f6" fill="url(#gSales)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="url(#gExp)"   strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Two-column: Category pie + Top products bar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sales by category */}
            <div className="card">
              <h3 className="mb-4">Sales by Category</h3>
              {categoryData.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No category data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top products */}
            <div className="card">
              <h3 className="mb-4">Top Products by Revenue</h3>
              {topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No product data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11 }} tickLine={false} width={100} />
                    <Tooltip formatter={(v) => fmt(v, currency)} />
                    <Bar dataKey="total_revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Low stock + AI insights ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Low stock */}
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alerts
              </h3>
              {lowStock.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No low-stock products. All good!</p>
              ) : (
                <div className="space-y-2">
                  {lowStock.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-500">Reorder at: {p.reorder_level} {p.unit || ''}</p>
                      </div>
                      <span className="badge-high">{p.current_stock} left</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Insight panel */}
            <div className="card bg-gradient-to-br from-primary-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <h3>AI Business Insight</h3>
                <button
                  onClick={fetchAI}
                  disabled={aiLoading}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  {aiLoading ? 'Generating…' : 'Generate'}
                </button>
              </div>
              {aiLoading && (
                <div className="flex items-center gap-2 py-6 text-gray-400 text-sm justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
                  Asking AI…
                </div>
              )}
              {!aiLoading && aiInsight && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 leading-relaxed">{aiInsight.summary}</p>
                  {aiInsight.key_problems?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Key Problems</p>
                      <ul className="space-y-1">
                        {aiInsight.key_problems.slice(0, 3).map((p, i) => (
                          <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                            <span className="text-red-400 mt-0.5">•</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {!aiLoading && !aiInsight && (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Click "Generate" to get AI-powered insights based on your real business data.
                </p>
              )}
            </div>
          </div>

          {/* ── Top products table ── */}
          <div className="card">
            <h3 className="mb-4">Top Selling Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-2 font-medium text-gray-500">#</th>
                    <th className="pb-2 font-medium text-gray-500">Product</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Qty Sold</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-400">No data</td></tr>
                  ) : topProducts.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-400 font-medium">{i + 1}</td>
                      <td className="py-2.5 font-medium text-gray-800">{p.product_name}</td>
                      <td className="py-2.5 text-right text-gray-600">{p.total_quantity?.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-800">{fmt(p.total_revenue, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
