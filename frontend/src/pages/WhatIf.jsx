import React, { useState } from 'react'
import { FlaskConical, TrendingUp, TrendingDown, Info, AlertCircle, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
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
      toast.success('Simulation computed!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  if (!activeBusiness) return <NoBusiness />
  const currency = activeBusiness.currency || 'INR'

  const isPositive = result && result.estimated_change >= 0

  const SCENARIOS = [
    {
      value: 'price_change',
      title: 'Price / Revenue Shift',
      desc: 'Simulate raising or lowering catalog prices or average order receipts.',
      currentLabel: 'Baseline Revenue in Period',
      newLabel: 'Projected Target Revenue',
      hint: 'Simulates the top-line margin impact if average ticket or pricing adjusts.',
    },
    {
      value: 'expense_change',
      title: 'Operating Expense Shift',
      desc: 'Simulate rent hikes, supplier discount renegotiations, or marketing ad cuts.',
      currentLabel: 'Baseline Overhead in Period',
      newLabel: 'Target Overhead Budget',
      hint: 'Simulates the bottom-line net profit variation if operating costs change.',
    },
  ]
  const activeScenario = SCENARIOS.find(s => s.value === scenarioType)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="What-If Decision Simulator"
        subtitle={`Model price changes and overhead variations before committing resources for ${activeBusiness.business_name}.`}
        badge="Scenario Modeling"
      />

      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-800 shadow-2xs">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-0.5">Predictive Planning Model</p>
          <p className="text-amber-700 leading-relaxed">
            Outputs are heuristic estimates evaluated against historical ledger velocity. Use this tool for hypothesis testing and risk bounds estimation.
          </p>
        </div>
      </div>

      <form onSubmit={handleRun} className="space-y-5">
        {/* Scenario type selector cards */}
        <div className="card">
          <label className="label mb-2.5">Select Decision Model</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SCENARIOS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => { setScenarioType(s.value); setResult(null) }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  scenarioType === s.value
                    ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    scenarioType === s.value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <FlaskConical size={16} />
                  </div>
                  {scenarioType === s.value && (
                    <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <p className="font-bold mt-2.5 text-sm text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-xs text-primary-700 bg-primary-50/80 p-3 rounded-xl border border-primary-100">
            <Info size={15} className="shrink-0" />
            <span>{activeScenario.hint}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{activeScenario.currentLabel} (₹)</label>
              <input
                type="number"
                step="any"
                className="input font-semibold"
                placeholder="e.g. 50000"
                value={currentVal}
                onChange={e => setCurrentVal(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">{activeScenario.newLabel} (₹)</label>
              <input
                type="number"
                step="any"
                className="input font-semibold"
                placeholder="e.g. 58000"
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <label className="label mb-0">Analysis Horizon:</label>
              <select
                className="input w-auto text-xs py-1.5"
                value={period}
                onChange={e => setPeriod(Number(e.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto px-6 py-2.5 shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles size={15} />
              <span>{loading ? 'Evaluating Scenario…' : 'Simulate Decision'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Results card */}
      {result && (
        <div className="card border border-primary-200/90 shadow-card-hover space-y-5 bg-gradient-to-b from-white to-primary-50/20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                Simulation Output
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{result.scenario_description}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Baseline Input</p>
              <p className="text-lg font-bold text-slate-800 mt-1">₹{Number(result.estimated_current).toLocaleString('en-IN')}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Simulated Target</p>
              <p className="text-lg font-bold text-slate-800 mt-1">₹{Number(result.estimated_new).toLocaleString('en-IN')}</p>
            </div>

            <div className={`p-3.5 rounded-xl border text-center ${
              isPositive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-75">Estimated Variance</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {isPositive ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-rose-600" />}
                <p className="text-lg font-black">
                  {isPositive ? '+' : ''}{result.estimated_change_pct?.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs font-bold mt-0.5">
                {isPositive ? '+' : ''}₹{Math.round(result.estimated_change).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* AI Explanation */}
          <div className="bg-white rounded-xl p-4 border border-primary-100 shadow-2xs">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-primary-700">
              <Sparkles size={14} className="text-primary-600" />
              <span>AI Operational Assessment</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {result.ai_explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
