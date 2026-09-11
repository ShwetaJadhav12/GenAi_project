import React, { useState } from 'react'
import { FileText, Download, RefreshCw, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ActionPlanCard from '../components/ActionPlanCard'
import toast from 'react-hot-toast'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function Reports() {
  const { activeBusiness } = useBusiness()
  const [period, setPeriod]   = useState(30)
  const [loading, setLoading] = useState(false)
  const [report, setReport]   = useState(null)

  const fetchReport = async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const r = await api.get(`/businesses/${activeBusiness.id}/reports/full?period_days=${period}`)
      setReport(r.data)
    } catch (err) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!report) return
    // Use browser print dialog as PDF — works without any server dependency
    window.print()
  }

  if (!activeBusiness) return <NoBusiness />

  const s = report?.summary

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Business Report"
        subtitle="Full performance report with AI insights and 7-day forecast."
        actions={
          <div className="flex items-center gap-2">
            <select className="input w-auto text-sm" value={period} onChange={e => setPeriod(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={fetchReport} disabled={loading} className="btn-primary flex items-center gap-2">
              <FileText size={15} />
              {loading ? 'Generating…' : 'Generate Report'}
            </button>
            {report && (
              <button onClick={handleDownload} className="btn-secondary flex items-center gap-2">
                <Download size={15} /> Print / PDF
              </button>
            )}
          </div>
        }
      />

      {loading && <LoadingSpinner message="Generating full report…" />}

      {!loading && !report && (
        <div className="card text-center py-14">
          <FileText size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Click "Generate Report" to create a full business performance report.</p>
        </div>
      )}

      {!loading && report && (
        <div id="report-content" className="space-y-6 print:space-y-4">

          {/* Header */}
          <div className="card bg-gradient-to-r from-primary-600 to-teal-600 text-white print:break-inside-avoid">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white text-xl font-bold">{report.business.name}</h2>
                <p className="text-primary-100 capitalize">{report.business.type} · {report.business.currency}</p>
                {report.business.location && <p className="text-primary-100 text-sm">{report.business.location}</p>}
              </div>
              <div className="text-right text-sm text-primary-100">
                <p>Period: {report.period.start} to {report.period.end}</p>
                <p>Generated: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* 1. KPI Summary */}
          <div className="card print:break-inside-avoid">
            <h3 className="mb-4">1. Business Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ['Total Revenue',     fmt(s.total_revenue),   'text-blue-600'],
                ['Total Expenses',    fmt(s.total_expenses),  'text-red-500'],
                ['Estimated Profit',  fmt(s.estimated_profit), s.estimated_profit >= 0 ? 'text-green-600' : 'text-red-600'],
                ['Transactions',      s.num_transactions,     'text-purple-600'],
              ].map(([label, val, cls]) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-lg font-bold ${cls}`}>{val}</p>
                </div>
              ))}
            </div>
            {s.profit_is_estimate && (
              <p className="text-xs text-amber-600 mt-2">* Profit is estimated (revenue − expenses). Add cost prices for accuracy.</p>
            )}
          </div>

          {/* 2. Sales Performance */}
          <div className="card print:break-inside-avoid">
            <h3 className="mb-4">2. Sales Performance</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Revenue vs Previous Period</p>
                <div className="flex items-center gap-2 mt-1">
                  {s.sales_growth_pct != null && (
                    s.sales_growth_pct >= 0
                      ? <TrendingUp size={16} className="text-green-500" />
                      : <TrendingDown size={16} className="text-red-500" />
                  )}
                  <p className="font-bold text-gray-800">
                    {s.sales_growth_pct != null ? `${s.sales_growth_pct > 0 ? '+' : ''}${s.sales_growth_pct}%` : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Transaction Value</p>
                <p className="font-bold text-gray-800 mt-1">{fmt(s.avg_transaction_value)}</p>
              </div>
            </div>
            {report.top_products?.length > 0 && (
              <>
                <p className="text-sm font-medium text-gray-600 mb-2">Top Products</p>
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left pb-1 text-gray-500">Product</th><th className="text-right pb-1 text-gray-500">Revenue</th></tr></thead>
                  <tbody>
                    {report.top_products.map((p,i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1.5">{p.product_name}</td>
                        <td className="py-1.5 text-right font-medium">{fmt(p.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* 3. Expense Performance */}
          <div className="card print:break-inside-avoid">
            <h3 className="mb-4">3. Expense Performance</h3>
            <div className="flex items-center gap-2 mb-3">
              {s.expense_growth_pct != null && (
                s.expense_growth_pct >= 0
                  ? <TrendingUp size={16} className="text-red-500" />
                  : <TrendingDown size={16} className="text-green-500" />
              )}
              <p className="text-sm text-gray-700">
                Expense growth vs previous period:{' '}
                <strong>{s.expense_growth_pct != null ? `${s.expense_growth_pct}%` : 'N/A'}</strong>
              </p>
            </div>
            {report.expense_by_category?.length > 0 && (
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left pb-1 text-gray-500">Category</th><th className="text-right pb-1 text-gray-500">Amount</th></tr></thead>
                <tbody>
                  {report.expense_by_category.map((e,i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1.5">{e.category}</td>
                      <td className="py-1.5 text-right">{fmt(e.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 4. Inventory Alerts */}
          {report.low_stock?.length > 0 && (
            <div className="card border-amber-200 bg-amber-50 print:break-inside-avoid">
              <h3 className="mb-3 flex items-center gap-2 text-amber-800">
                <AlertCircle size={16} /> 4. Inventory Alerts
              </h3>
              <ul className="space-y-1">
                {report.low_stock.map(p => (
                  <li key={p.id} className="text-sm text-amber-700">
                    <strong>{p.name}</strong> — {p.current_stock} remaining (reorder at {p.reorder_level})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. AI Insights */}
          {report.ai_insights && (
            <div className="card print:break-inside-avoid">
              <h3 className="mb-3">5. AI Insights &amp; Recommendations</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{report.ai_insights.summary}</p>
              {report.ai_insights.recommendations?.length > 0 && (
                <ul className="space-y-1.5">
                  {report.ai_insights.recommendations.map((r,i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-green-500 font-bold">→</span>{r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 6. Action Plan */}
          {report.ai_insights?.action_plan?.length > 0 && (
            <div className="print:break-inside-avoid">
              <h3 className="mb-3">6. Action Plan</h3>
              <div className="space-y-3">
                {report.ai_insights.action_plan.map((item, i) => (
                  <ActionPlanCard key={i} item={item} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* 7. Sales Forecast */}
          {report.forecast?.has_forecast && (
            <div className="card print:break-inside-avoid">
              <h3 className="mb-3">7. 7-Day Sales Forecast</h3>
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left pb-1 text-gray-500">Date</th><th className="text-right pb-1 text-gray-500">Predicted Sales</th></tr></thead>
                <tbody>
                  {report.forecast.forecast.map(f => (
                    <tr key={f.date} className="border-b border-gray-50">
                      <td className="py-1.5">{f.date}</td>
                      <td className="py-1.5 text-right font-medium text-amber-700">{fmt(f.predicted_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.forecast.mae && (
                <p className="text-xs text-gray-400 mt-2">Model accuracy — MAE: ₹{report.forecast.mae} · RMSE: ₹{report.forecast.rmse}</p>
              )}
            </div>
          )}
          {report.forecast && !report.forecast.has_forecast && (
            <div className="card border-gray-200">
              <h3 className="mb-2">7. Sales Forecast</h3>
              <p className="text-sm text-gray-500">{report.forecast.message}</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
