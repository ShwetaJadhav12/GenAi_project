import React, { useState } from 'react'
import { FlaskConical, TrendingUp, TrendingDown, Info, AlertCircle } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

export default function WhatIf() {
  const { activeBusiness } = useBusiness()

  const [scenarioType, setScenarioType] = useState('price_change')
  const [period, setPeriod]             = useState(30)
  const [currentVal, setCurrentVal]     = useState('')
  const [newVal, setNewVal]             = useState('')
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState(null)

  const handleRun = async (e) => {
    e.preventDefault()
    if (!currentVal || !newVal) { toast.error('Please enter both values'); return }
    setLoading(true)
    setResult(null)
    try {
      const r = await api.post(`/businesses/${activeBusiness.id}/ai/whatif`, {
        business_id:   activeBusiness.id,
        scenario_type: scenarioType,
        current_value: parseFloat(currentVal),
        new_value:     parseFloat(newVal),
        period_days:   period,
      })
      setResult(r.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  if (!activeBusiness) return <NoBusiness />

  const isPositive = result && result.estimated_change >= 0
  const label = scenarioType === 'price_change' ? 'Revenue Impact' : 'Expense Impact'

  const SCENARIOS = [
    {
      value: 'price_change',
      title: 'Price Change',
      desc: 'Simulate changing a product price and see estimated revenue impact.',
      currentLabel: 'Current Average Revenue (last period)',
      newLabel: 'Simulated New Revenue',
      hint: 'Enter your current period revenue and a new value to simulate.',
    },
    {
      value: 'expense_change',
      title: 'Expense Change',
      desc: 'Simulate reducing or increasing a specific expense.',
      currentLabel: 'Current Expense Amount',
      newLabel: 'New Expense Amount',
      hint: 'Enter current expense and a new value to see the net impact.',
    },
  ]
  const activeScenario = SCENARIOS.find(s => s.value === scenarioType)

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="What-If Simulator"
        subtitle="Estimate the impact of business decisions before making them."
      />

      {/* Disclaimer */}
      <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-sm text-amber-700">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        Results are <strong>estimates</strong> based on historical averages.
        They do not guarantee actual outcomes and should be used for planning only.
      </div>

      <form onSubmit={handleRun} className="space-y-5">
        {/* Scenario type */}
        <div className="card">
          <label className="label mb-2">Scenario Type</label>
          <div className="grid grid-cols-2 gap-3">
            {SCENARIOS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => { setScenarioType(s.value); setResult(null) }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  scenarioType === s.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FlaskConical size={18} className={scenarioType === s.value ? 'text-primary-600' : 'text-gray-400'} />
                <p className={`font-semibold mt-2 text-sm ${scenarioType === s.value ? 'text-primary-700' : 'text-gray-700'}`}>
                  {s.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50 p-2.5 rounded-lg">
            <Info size={15} className="shrink-0 mt-0.5" />{activeScenario.hint}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Current Value (₹)</label>
              <input
                type="number" step="0.01" className="input"
                placeholder="e.g. 50000"
                value={currentVal}
                onChange={e => setCurrentVal(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">New Value (₹)</label>
              <input
                type="number" step="0.01" className="input"
                placeholder="e.g. 55000"
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Analysis Period</label>
            <select className="input w-auto" value={period} onChange={e => setPeriod(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Simulating…' : 'Run Simulation'}
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="card border-2 border-primary-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Estimated Scenario</p>
            <p className="text-sm text-gray-600 mb-4">{result.scenario_description}</p>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Current</p>
                <p className="font-bold text-gray-800">₹{result.estimated_current.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">New (Simulated)</p>
                <p className="font-bold text-gray-800">₹{result.estimated_new.toLocaleString('en-IN')}</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-xs text-gray-400 mb-1">Change</p>
                <div className="flex items-center justify-center gap-1">
                  {isPositive
                    ? <TrendingUp size={14} className="text-green-600" />
                    : <TrendingDown size={14} className="text-red-600" />
                  }
                  <p className={`font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                    {isPositive ? '+' : ''}{result.estimated_change_pct.toFixed(1)}%
                  </p>
                </div>
                <p className={`text-xs mt-0.5 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}₹{result.estimated_change.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="bg-primary-50 rounded-lg p-3 border border-primary-100">
              <p className="text-xs font-semibold text-primary-700 mb-1.5">AI Explanation</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.ai_explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
