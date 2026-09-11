import React, { useState, useCallback } from 'react'
import { Brain, RefreshCw, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ActionPlanCard from '../components/ActionPlanCard'
import toast from 'react-hot-toast'

const priorityClass = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' }

export default function AIInsights() {
  const { activeBusiness } = useBusiness()
  const [period, setPeriod]   = useState(30)
  const [loading, setLoading] = useState(false)
  const [data, setData]       = useState(null)

  const fetchInsights = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const r = await api.get(`/businesses/${activeBusiness.id}/ai/insights?period_days=${period}`)
      setData(r.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }, [activeBusiness, period])

  if (!activeBusiness) return <NoBusiness />

  const ins = data?.insights
  const met = data?.metrics_used?.summary

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="AI Insights"
        subtitle="Verified business metrics explained by AI in plain language."
        actions={
          <div className="flex items-center gap-2">
            <select className="input w-auto text-sm" value={period} onChange={e => setPeriod(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={fetchInsights} disabled={loading} className="btn-primary flex items-center gap-2">
              <Brain size={15} />
              {loading ? 'Generating…' : 'Generate Insights'}
            </button>
          </div>
        }
      />

      {/* Info banner */}
      <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2 text-sm text-blue-700">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <span>
          The analytics engine calculates all numbers from your database first.
          The AI only <em>explains</em> those pre-computed facts — it never invents figures.
        </span>
      </div>

      {loading && <LoadingSpinner message="Asking AI…" />}

      {!loading && !ins && (
        <div className="card text-center py-14">
          <Brain size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Click "Generate Insights" to analyse your business data.</p>
        </div>
      )}

      {!loading && ins && (
        <div className="space-y-5">

          {/* Verified metrics used */}
          {met && (
            <div className="card bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Verified Metrics Used by AI
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {[
                  ['Revenue', `₹${Number(met.total_revenue).toLocaleString('en-IN')}`],
                  ['Expenses', `₹${Number(met.total_expenses).toLocaleString('en-IN')}`],
                  ['Est. Profit', `₹${Number(met.estimated_profit).toLocaleString('en-IN')}`],
                  ['Transactions', met.num_transactions],
                  ['Sales Growth', met.sales_growth_pct != null ? `${met.sales_growth_pct}%` : 'N/A'],
                  ['Expense Growth', met.expense_growth_pct != null ? `${met.expense_growth_pct}%` : 'N/A'],
                  ['Avg Tx Value', `₹${Number(met.avg_transaction_value).toLocaleString('en-IN')}`],
                  ['Period', met.period_label],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-gray-400 text-xs">{k}</p>
                    <p className="font-semibold text-gray-800">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="card bg-gradient-to-br from-primary-50 to-white border border-primary-100">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-primary-600" />
              <h3>Business Summary</h3>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ins.summary}</p>
          </div>

          {/* Key Problems */}
          {ins.key_problems?.length > 0 && (
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 text-red-700">
                <AlertCircle size={16} /> Key Problems
              </h3>
              <ul className="space-y-2">
                {ins.key_problems.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-400 font-bold mt-0.5">•</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {ins.recommendations?.length > 0 && (
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 text-green-700">
                <CheckCircle size={16} /> Recommendations
              </h3>
              <ul className="space-y-2">
                {ins.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 font-bold mt-0.5">→</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Plan */}
          {ins.action_plan?.length > 0 && (
            <div>
              <h3 className="mb-3">This Week's Action Plan</h3>
              <div className="space-y-3">
                {ins.action_plan.map((item, i) => (
                  <ActionPlanCard key={i} item={item} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
