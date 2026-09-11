import React, { useState, useCallback } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, RefreshCw, AlertCircle, Info } from 'lucide-react'
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
    } catch (err) {
      toast.error('Failed to fetch forecast')
    } finally {
      setLoading(false)
    }
  }, [activeBusiness, days])

  if (!activeBusiness) return <NoBusiness />

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

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Sales Forecast"
        subtitle="Machine learning model predicts the next 7 days from your historical sales."
        actions={
          <div className="flex items-center gap-2">
            <select
              className="input w-auto text-sm"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
            >
              <option value={30}>Use 30 days history</option>
              <option value={60}>Use 60 days history</option>
              <option value={90}>Use 90 days history</option>
            </select>
            <button onClick={fetchForecast} disabled={loading} className="btn-primary flex items-center gap-2">
              <TrendingUp size={15} />
              {loading ? 'Forecasting…' : 'Run Forecast'}
            </button>
          </div>
        }
      />

      {/* Model info */}
      <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2 text-sm text-blue-700">
        <Info size={16} className="shrink-0 mt-0.5" />
        <span>
          Uses <strong>Linear Regression</strong> (scikit-learn) trained on daily sales with day, month,
          and day-of-week features. Requires at least 14 days of sales data.
        </span>
      </div>

      {loading && <LoadingSpinner message="Training model and generating forecast…" />}

      {!loading && !result && (
        <div className="card text-center py-14">
          <TrendingUp size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Click "Run Forecast" to generate a 7-day sales prediction.</p>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-5">

          {/* Not enough data */}
          {!result.has_forecast && (
            <div className="card border-amber-200 bg-amber-50 flex gap-3">
              <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Insufficient Data</p>
                <p className="text-sm text-amber-700 mt-1">{result.message}</p>
              </div>
            </div>
          )}

          {result.has_forecast && (
            <>
              {/* Model metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                  <p className="text-xs text-gray-400 mb-1">Model</p>
                  <p className="font-bold text-gray-800">Linear Regression</p>
                </div>
                <div className="card text-center">
                  <p className="text-xs text-gray-400 mb-1">MAE</p>
                  <p className="font-bold text-gray-800">
                    {result.mae != null ? `₹${result.mae.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div className="card text-center">
                  <p className="text-xs text-gray-400 mb-1">RMSE</p>
                  <p className="font-bold text-gray-800">
                    {result.rmse != null ? `₹${result.rmse.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="card">
                <h3 className="mb-4">Historical Sales + 7-Day Forecast</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval={6} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} tickLine={false} />
                    <Tooltip formatter={(v, name) => [`₹${v?.toLocaleString('en-IN') ?? ''}`, name]} />
                    <Legend />
                    {splitDate && (
                      <ReferenceLine x={splitDate} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Today', fontSize: 10 }} />
                    )}
                    <Bar dataKey="actual" name="Historical Sales" fill="#3b82f6" opacity={0.7} radius={[2,2,0,0]} />
                    <Line dataKey="predicted" name="Forecast" stroke="#f59e0b" strokeWidth={2.5}
                      dot={{ fill: '#f59e0b', r: 4 }} connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Forecast table */}
              <div className="card">
                <h3 className="mb-3">7-Day Sales Forecast</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left pb-2 font-medium text-gray-500">Date</th>
                        <th className="text-right pb-2 font-medium text-gray-500">Predicted Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.forecast.map(f => (
                        <tr key={f.date} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 text-gray-700">{f.date}</td>
                          <td className="py-2.5 text-right font-semibold text-amber-700">
                            ₹{f.predicted_amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200">
                        <td className="pt-2 font-semibold">Total (7 days)</td>
                        <td className="pt-2 text-right font-bold text-amber-700">
                          ₹{result.forecast.reduce((s,f) => s + f.predicted_amount, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  * Forecast is an estimate based on historical patterns. Actual sales may vary.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
