import React, { useState, useCallback } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, RefreshCw, AlertCircle, Info, Sparkles, Calendar, DollarSign } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const fmtShort = (n) => {
  if (n >= 100000) return `${(n/100000).toFixed(1)}L`
  if (n >= 1000)   return `${(n/1000).toFixed(1)}K`
  return n?.toFixed(0) ?? '0'
}

const fmt = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0)

export default function Forecast() {
  const { activeBusiness } = useBusiness()
  const [days, setDays]     = useState(90)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const fetchForecast = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const r = await api.get(`/businesses/${activeBusiness.id}/forecast?days=${days}`)
      setResult(r.data)
      if (r.data.has_forecast) toast.success('7-day forecast modeled successfully')
    } catch (err) {
      toast.error('Failed to calculate forecast')
    } finally {
      setLoading(false)
    }
  }, [activeBusiness, days])

  if (!activeBusiness) return <NoBusiness />
  const currency = activeBusiness.currency || 'INR'

  // Combine historical + forecast for chart
  const chartData = [
    ...(result?.historical || []).map(d => ({
      date: d.date.slice(5),
      actual: d.amount,
      predicted: null,
    })),
    ...(result?.forecast || []).map(d => ({
      date: d.date.slice(5),
      actual: null,
      predicted: d.predicted_amount,
    })),
  ]
  const splitDate = result?.historical?.length
    ? result.historical[result.historical.length - 1]?.date?.slice(5)
    : null

  const totalForecast = result?.forecast?.reduce((s, f) => s + f.predicted_amount, 0) || 0
  const dailyAvgForecast = result?.forecast?.length ? totalForecast / result.forecast.length : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Predictive Sales Forecast"
        subtitle={`Machine learning model forecasting the next 7 days based on transaction velocity for ${activeBusiness.business_name}.`}
        badge="ML Regression"
        actions={
          <div className="flex items-center gap-2">
            <select
              className="input w-auto text-xs py-2"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
            >
              <option value={30}>30 Days Rolling Window</option>
              <option value={60}>60 Days Rolling Window</option>
              <option value={90}>90 Days Rolling Window</option>
            </select>
            <button
              onClick={fetchForecast}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <TrendingUp size={15} />
              <span>{loading ? 'Modeling…' : 'Run Forecast'}</span>
            </button>
          </div>
        }
      />

      {/* Model banner */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3 text-xs text-slate-600 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
          <Info size={16} />
        </div>
        <div>
          <p className="font-bold text-slate-800 mb-0.5">Scikit-Learn Regression Pipeline</p>
          <p className="leading-relaxed text-slate-500">
            Extracts day-of-week, seasonal trend, and temporal features to fit a robust multi-variate linear regression curve. Minimum 14 days of recorded transactions recommended.
          </p>
        </div>
      </div>

      {loading && <LoadingSpinner message="Training regression algorithm on historical ledger data…" />}

      {!loading && !result && (
        <div className="card text-center py-16 border-dashed border-2 border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Forecast Not Yet Calculated</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            Click "Run Forecast" to train the regression model and project your next 7-day revenue stream.
          </p>
          <button onClick={fetchForecast} className="btn-primary">
            <Sparkles size={15} className="mr-1.5" />
            Generate Forecast
          </button>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-6">
          {!result.has_forecast && (
            <div className="card border-amber-200 bg-amber-50/70 p-5 flex gap-3.5 items-start">
              <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm">Insufficient Sales History</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">{result.message}</p>
              </div>
            </div>
          )}

          {result.has_forecast && (
            <>
              {/* Executive forecast metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 border-0">
                  <p className="text-[11px] font-bold text-primary-300 uppercase tracking-wider">7-Day Projected Total</p>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-1 text-white">
                    {fmt(totalForecast, currency)}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-2 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-400" /> Projected weekly run-rate
                  </p>
                </div>

                <div className="card p-5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Projected Daily Average</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
                    {fmt(dailyAvgForecast, currency)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">Per-day estimated sales velocity</p>
                </div>

                <div className="card p-5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Model Precision (MAE)</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
                    {result.mae != null ? `₹${Math.round(result.mae).toLocaleString('en-IN')}` : 'N/A'}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    ✓ Linear Regression validated
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Historical Sales vs. Projected Horizon</h3>
                    <p className="text-xs text-slate-500">Bars represent actual recorded intake; orange line represents predicted path</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-3 h-3 rounded-xs bg-primary-500/70" /> Actual
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <span className="w-3 h-3 rounded-xs bg-amber-500" /> Forecast
                    </span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={6} axisLine={{ stroke: '#f1f5f9' }} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                    <Tooltip formatter={(v, name) => [`₹${v?.toLocaleString('en-IN') ?? ''}`, name]} />
                    {splitDate && (
                      <ReferenceLine x={splitDate} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Today', fontSize: 11, fill: '#64748b' }} />
                    )}
                    <Bar dataKey="actual" name="Historical Sales" fill="#4f46e5" opacity={0.6} radius={[4, 4, 0, 0]} />
                    <Line
                      dataKey="predicted"
                      name="Predicted Sales"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Forecast Day-by-Day Table */}
              <div className="card">
                <h3 className="text-base font-bold text-slate-900 mb-1">Day-by-Day Projections</h3>
                <p className="text-xs text-slate-500 mb-4">Detailed prediction breakdown with weekly sum</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-left">
                        <th className="pb-2.5">Forecast Target Date</th>
                        <th className="pb-2.5 text-right">Projected Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {result.forecast.map((f, i) => (
                        <tr key={f.date} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 font-semibold text-slate-700 flex items-center gap-2">
                            <Calendar size={13} className="text-slate-400" />
                            {f.date}
                          </td>
                          <td className="py-2.5 text-right font-extrabold text-amber-700">
                            ₹{Math.round(f.predicted_amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200">
                        <td className="pt-3 font-bold text-slate-900 text-xs">Total 7-Day Predicted Demand</td>
                        <td className="pt-3 text-right font-black text-amber-700 text-sm">
                          ₹{Math.round(totalForecast).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
