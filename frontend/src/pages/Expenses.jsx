import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Receipt, PieChart as PieIcon, X } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1','#f43f5e','#f59e0b','#10b981','#8b5cf6','#f97316','#06b6d4','#ec4899']

const EXPENSE_CATEGORIES = ['Rent','Utilities','Salaries','Marketing','Supplies','Packaging','Transport','Maintenance','Other']

const fmt = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0)

function ExpenseModal({ bizId, currency, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ date: today, category: 'Rent', description: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount) { toast.error('Amount is required'); return }
    setLoading(true)
    try {
      await api.post(`/businesses/${bizId}/expenses`, { ...form, amount: parseFloat(form.amount) })
      toast.success('Expense logged!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Record Overhead Expense</h2>
            <p className="text-xs text-slate-400">Log recurring or one-off operational cost</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input text-xs" value={form.date} onChange={set('date')} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input text-xs" value={form.category} onChange={set('category')}>
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description / Vendor</label>
            <input className="input text-xs" placeholder="e.g. Shop electricity bill for May" value={form.description} onChange={set('description')} />
          </div>

          <div>
            <label className="label">Total Amount ({currency}) *</label>
            <input type="number" step="any" className="input text-xs font-bold" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? 'Recording…' : 'Record Expense'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary py-2.5">Cancel</button>
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeBusiness])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this expense record?')) return
    try {
      await api.delete(`/businesses/${activeBusiness.id}/expenses/${id}`)
      toast.success('Expense removed')
      fetchExpenses()
    } catch {
      toast.error('Failed to remove expense')
    }
  }

  if (!activeBusiness) return <NoBusiness />
  const currency = activeBusiness.currency || 'INR'

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operating Expenses"
        subtitle={`Track overhead, rent, wages, and vendor disbursements for ${activeBusiness.business_name}.`}
        badge={`${expenses.length} Records`}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} />
            <span>Add Expense</span>
          </button>
        }
      />

      {showModal && (
        <ExpenseModal
          bizId={activeBusiness.id}
          currency={currency}
          onClose={() => setShowModal(false)}
          onSaved={fetchExpenses}
        />
      )}

      {loading ? <LoadingSpinner message="Calculating cost breakdown…" /> : (
        <div className="space-y-6">
          {/* Summary + category chart */}
          {byCategory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="card p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-bold text-primary-300 uppercase tracking-wider">Cumulative Expenses Logged</p>
                  <p className="text-3xl font-black text-white mt-2">
                    {fmt(total, currency)}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">{expenses.length} distinct expense entries recorded</p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                  Subtracted from gross turnover to calculate operating margins.
                </div>
              </div>

              <div className="card lg:col-span-2 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Expense Allocation by Category</h3>
                  <p className="text-xs text-slate-400">Past 30-day overhead distribution</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 mt-2">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {byCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-1.5 text-xs">
                    {byCategory.slice(0, 5).map((cat, i) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-slate-600 truncate font-medium">{cat.category}</span>
                        </div>
                        <span className="font-bold text-slate-800">{fmt(cat.total, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card p-0 overflow-hidden shadow-card">
            {expenses.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title="No expenses logged"
                  message="Record your rent, payroll, supplier invoices, or utility costs to compute accurate net margins."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase tracking-wider font-semibold text-left">
                      <th className="py-3 pl-5">Date</th>
                      <th className="py-3">Category</th>
                      <th className="py-3">Vendor / Notes</th>
                      <th className="py-3 text-right">Amount</th>
                      <th className="py-3 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pl-5 font-medium text-slate-600 whitespace-nowrap">{e.date}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60 uppercase">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 font-medium">{e.description || '—'}</td>
                        <td className="py-3 text-right font-extrabold text-rose-600">
                          {fmt(e.amount, currency)}
                        </td>
                        <td className="py-3 pr-5 text-right">
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
