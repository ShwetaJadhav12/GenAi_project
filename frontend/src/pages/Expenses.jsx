import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#f97316','#06b6d4','#ec4899']

const EXPENSE_CATEGORIES = ['Rent','Utilities','Salaries','Marketing','Supplies','Packaging','Transport','Maintenance','Other']

function ExpenseModal({ bizId, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ date: today, category: 'Rent', description: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/businesses/${bizId}/expenses`, { ...form, amount: parseFloat(form.amount) })
      toast.success('Expense added!')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2>Add Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={set('date')} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="e.g. Monthly shop rent" value={form.description} onChange={set('description')} />
          </div>
          <div>
            <label className="label">Amount *</label>
            <input type="number" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Add Expense'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Expenses() {
  const { activeBusiness } = useBusiness()
  const [expenses, setExpenses]   = useState([])
  const [byCategory, setByCategory] = useState([])
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)

  const fetchExpenses = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const [listR, catR] = await Promise.all([
        api.get(`/businesses/${activeBusiness.id}/expenses?limit=200`),
        api.get(`/businesses/${activeBusiness.id}/analytics/expense-by-category?period_days=30`),
      ])
      setExpenses(listR.data)
      setByCategory(catR.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [activeBusiness])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await api.delete(`/businesses/${activeBusiness.id}/expenses/${id}`)
      toast.success('Deleted'); fetchExpenses()
    } catch { toast.error('Delete failed') }
  }

  if (!activeBusiness) return <NoBusiness />

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Track business costs and overheads"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add Expense
          </button>
        }
      />

      {showModal && <ExpenseModal bizId={activeBusiness.id} onClose={() => setShowModal(false)} onSaved={fetchExpenses} />}

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-5">
          {/* Summary + chart */}
          {byCategory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card flex flex-col justify-center">
                <p className="text-sm text-gray-500 mb-1">Total Expenses (all time)</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-400 mt-1">{expenses.length} expense records</p>
              </div>
              <div className="card">
                <h3 className="mb-3">Expenses by Category (last 30 days)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={65}
                      label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {byCategory.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-x-auto">
            {expenses.length === 0 ? (
              <EmptyState title="No expenses recorded" message="Add your first expense to track business costs." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    {['Date','Category','Description','Amount',''].map(h => (
                      <th key={h} className="pb-2 font-medium text-gray-500 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-4">{e.date}</td>
                      <td className="py-2.5 pr-4">
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{e.category}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-600">{e.description || '—'}</td>
                      <td className="py-2.5 pr-4 font-semibold text-right">
                        ₹{e.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2.5">
                        <button onClick={() => handleDelete(e.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
