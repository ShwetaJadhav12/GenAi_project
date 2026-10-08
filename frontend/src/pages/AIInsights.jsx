import React, { useState, useCallback } from 'react'
import {
  Brain, RefreshCw, AlertCircle, CheckCircle, Lightbulb,
  Sparkles, ShieldCheck, ArrowRight, Zap, Target
} from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ActionPlanCard from '../components/ActionPlanCard'
import toast from 'react-hot-toast'

export default function AIInsights() {
  const { activeBusiness } = useBusiness()
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  const fetchInsights = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const r = await api.get(`/businesses/${activeBusiness.id}/ai/insights?period_days=${period}`)
      setData(r.data)
      toast.success('Executive insights generated successfully')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }, [activeBusiness, period])

  if (!activeBusiness) return <NoBusiness />

  const ins = data?.insights
  const met = data?.metrics_used?.summary
  const currency = activeBusiness.currency || 'INR'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Executive AI Insights"
        subtitle={`Deterministic financial metrics analyzed and synthesized by AI for ${activeBusiness.business_name}.`}
        badge="Zero Hallucination"
        actions={
          <div className="flex items-center gap-2">
            <select
              className="input w-auto text-xs py-2"
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={fetchInsights}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles size={15} />
              <span>{loading ? 'Synthesizing…' : 'Generate Insights'}</span>
            </button>
          </div>
        }
      />

      {/* Info banner explaining deterministic pipeline */}
      <div className="p-4 bg-gradient-to-r from-primary-50 via-indigo-50/50 to-slate-50 border border-primary-200/60 rounded-2xl flex items-start gap-3 text-xs text-slate-700 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck size={16} />
        </div>
        <div>
          <p className="font-bold text-slate-900 mb-0.5">Verified Calculation Guarantee</p>
          <p className="text-slate-600 leading-relaxed">
            All financials, margins, and trends are mathematically derived by the local database engine first.
            The generative model strictly interprets these pre-computed facts — ensuring numbers are 100% truthful.
          </p>
        </div>
      </div>

      {loading && <LoadingSpinner message="Querying ledger metrics & generating executive synthesis…" />}

      {!loading && !ins && (
        <div className="card text-center py-16 border-dashed border-2 border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <Brain size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No Insights Generated Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            Click "Generate Insights" above to synthesize your sales, overhead, margin trajectories, and inventory alerts into an executive action briefing.
          </p>
          <button onClick={fetchInsights} className="btn-primary">
            <Sparkles size={15} className="mr-1.5" />
            Analyze Now
          </button>
        </div>
      )}

      {!loading && ins && (
        <div className="space-y-6">
          {/* Verified metrics used */}
          {met && (
            <div className="card bg-slate-50/70 border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Pre-Computed Ledger Facts Used in Synthesis
                </p>
                <span className="text-[11px] font-semibold text-slate-500">{met.period_label}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Turnover', val: `₹${Number(met.total_revenue || 0).toLocaleString('en-IN')}` },
                  { label: 'Operating Expenses', val: `₹${Number(met.total_expenses || 0).toLocaleString('en-IN')}` },
                  { label: 'Net Profit (Est.)', val: `₹${Number(met.estimated_profit || 0).toLocaleString('en-IN')}` },
                  { label: 'Transaction Count', val: met.num_transactions },
                  { label: 'Sales Growth Rate', val: met.sales_growth_pct != null ? `${met.sales_growth_pct}%` : 'N/A' },
                  { label: 'Expense Growth Rate', val: met.expense_growth_pct != null ? `${met.expense_growth_pct}%` : 'N/A' },
                  { label: 'Avg Ticket Value', val: `₹${Math.round(met.avg_transaction_value || 0).toLocaleString('en-IN')}` },
                  { label: 'Calculated Period', val: met.period_label },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <p className="font-extrabold text-sm text-slate-800 mt-0.5">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive Summary */}
          <div className="card bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border-0 shadow-lg p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-primary-300">
                <Sparkles size={18} />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Executive Operational Summary</h3>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-normal">
              {ins.summary}
            </p>
          </div>

          {/* Problems & Opportunities 2-col */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Key Problems */}
            {ins.key_problems?.length > 0 && (
              <div className="card border-t-4 border-t-rose-500">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-700">
                  <AlertCircle size={17} /> Operational Bottlenecks &amp; Risks
                </h3>
                <ul className="space-y-2.5 text-xs">
                  {ins.key_problems.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-rose-50/50 border border-rose-100 text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {ins.recommendations?.length > 0 && (
              <div className="card border-t-4 border-t-emerald-500">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
                  <CheckCircle size={17} /> Strategic Growth Recommendations
                </h3>
                <ul className="space-y-2.5 text-xs">
                  {ins.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      <span className="leading-relaxed font-medium">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Plan */}
          {ins.action_plan?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-primary-600" />
                <h3 className="text-base font-bold text-slate-900">Prioritized Action Protocol</h3>
              </div>
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
