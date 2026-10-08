import React, { useState } from 'react'
import { FileText, Download, RefreshCw, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Sparkles, Printer } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ActionPlanCard from '../components/ActionPlanCard'
import toast from 'react-hot-toast'

const fmt = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0)

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
      toast.success('Executive dossier compiled!')
    } catch (err) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!report) return
    window.print()
  }

  if (!activeBusiness) return <NoBusiness />
  const currency = activeBusiness.currency || 'INR'

  const s = report?.summary

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Executive Business Dossier"
        subtitle={`Comprehensive operational audit, forecasts, and AI recommendations for ${activeBusiness.business_name}.`}
        badge="Boardroom Ready"
        actions={
          <div className="flex items-center gap-2 print:hidden">
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
              onClick={fetchReport}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles size={15} />
              <span>{loading ? 'Compiling…' : 'Compile Report'}</span>
            </button>
            {report && (
              <button
                onClick={handleDownload}
                className="btn-secondary flex items-center gap-2"
              >
                <Printer size={15} />
                <span>Print / Save PDF</span>
              </button>
            )}
          </div>
        }
      />

      {loading && <LoadingSpinner message="Aggregating ledger data, running ML forecasts, and synthesizing executive dossier…" />}

      {!loading && !report && (
        <div className="card text-center py-16 border-dashed border-2 border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Report Not Yet Compiled</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            Click "Compile Report" above to generate a complete business dossier including sales trends, category distribution, inventory status, and AI strategic next steps.
          </p>
          <button onClick={fetchReport} className="btn-primary">
            Compile Dossier
          </button>
        </div>
      )}

      {!loading && report && (
        <div id="report-content" className="space-y-6 print:space-y-4">
          {/* Executive Header Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-lg print:break-inside-avoid">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-300 bg-white/10 px-2.5 py-1 rounded-full">
                  Executive Performance Briefing
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">{report.business.name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 capitalize font-medium">
                  <span>{report.business.type}</span>
                  <span>•</span>
                  <span>Base Currency: {report.business.currency}</span>
                  {report.business.location && (
                    <>
                      <span>•</span>
                      <span>{report.business.location}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-300 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                <p className="font-semibold text-white">Audit Window: {report.period.start} to {report.period.end}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Compiled: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* 1. KPI Summary */}
          <div className="card print:break-inside-avoid space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-md bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="text-base font-bold text-slate-900">Financial Performance Overview</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Gross Revenue', val: fmt(s.total_revenue, currency), color: 'text-primary-700' },
                { label: 'Total Operating Costs', val: fmt(s.total_expenses, currency), color: 'text-rose-600' },
                { label: 'Estimated Net Profit', val: fmt(s.estimated_profit, currency), color: s.estimated_profit >= 0 ? 'text-emerald-600' : 'text-rose-600' },
                { label: 'Total Orders / Invoices', val: s.num_transactions, color: 'text-slate-900' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                  <p className={`text-xl font-black mt-1 ${item.color}`}>{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Sales & Inventory Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Top products */}
            <div className="card print:break-inside-avoid">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                <span className="w-6 h-6 rounded-md bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">2</span>
                <h3 className="text-sm font-bold text-slate-900">Top Revenue Generators</h3>
              </div>

              {report.top_products?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-left uppercase">
                        <th className="pb-2">Product Name</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.top_products.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 font-medium text-slate-800">{p.product_name}</td>
                          <td className="py-2 text-right font-bold text-slate-900">{fmt(p.total_revenue, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No product data recorded in this period.</p>
              )}
            </div>

            {/* Inventory Alerts */}
            <div className="card print:break-inside-avoid">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                <span className="w-6 h-6 rounded-md bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">3</span>
                <h3 className="text-sm font-bold text-slate-900">Inventory Replenishment Status</h3>
              </div>

              {report.low_stock?.length > 0 ? (
                <div className="space-y-2">
                  {report.low_stock.map(p => (
                    <div key={p.id} className="p-2 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-rose-900">{p.name}</span>
                      <span className="font-bold text-rose-700">{p.current_stock} remaining (reorder at {p.reorder_level})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center font-medium">
                  ✓ All tracked items are above safety thresholds.
                </p>
              )}
            </div>
          </div>

          {/* 3. AI Insights */}
          {report.ai_insights && (
            <div className="card print:break-inside-avoid space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-6 h-6 rounded-md bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">4</span>
                <h3 className="text-base font-bold text-slate-900">AI Synthesis &amp; Strategic Observations</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {report.ai_insights.summary}
              </p>

              {report.ai_insights.recommendations?.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">Key Recommendations:</p>
                  <ul className="space-y-1.5 text-xs">
                    {report.ai_insights.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-800">
                        <span className="text-primary-600 font-bold">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 4. Action Plan */}
          {report.ai_insights?.action_plan?.length > 0 && (
            <div className="print:break-inside-avoid space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="w-6 h-6 rounded-md bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">5</span>
                <h3 className="text-base font-bold text-slate-900">Recommended Tactical Action Plan</h3>
              </div>
              <div className="space-y-2.5">
                {report.ai_insights.action_plan.map((item, i) => (
                  <ActionPlanCard key={i} item={item} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* 5. 7-Day Sales Forecast */}
          {report.forecast?.has_forecast && (
            <div className="card print:break-inside-avoid space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-6 h-6 rounded-md bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">6</span>
                <h3 className="text-base font-bold text-slate-900">Predictive 7-Day Demand Horizon</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-left uppercase">
                      <th className="pb-2">Target Date</th>
                      <th className="pb-2 text-right">Predicted Turnover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.forecast.forecast.map(f => (
                      <tr key={f.date} className="hover:bg-slate-50">
                        <td className="py-2 text-slate-700 font-medium">{f.date}</td>
                        <td className="py-2 text-right font-extrabold text-amber-700">{fmt(f.predicted_amount, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
