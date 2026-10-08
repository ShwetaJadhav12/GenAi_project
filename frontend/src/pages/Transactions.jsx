import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Filter, Search, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

const fmt = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0)

function TransactionModal({ bizId, currency, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date: today, type: 'sale', product_name: '', category: '',
    quantity: '', unit_price: '', total_amount: '', description: '', source: 'manual'
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Auto-calculate total
  const qty   = parseFloat(form.quantity)
  const price = parseFloat(form.unit_price)
  useEffect(() => {
    if (!isNaN(qty) && !isNaN(price)) setForm(f => ({ ...f, total_amount: (qty * price).toFixed(2) }))
  }, [form.quantity, form.unit_price])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.total_amount) { toast.error('Total amount is required'); return }
    setLoading(true)
    try {
      const payload = {
        ...form,
        quantity:     form.quantity     ? parseFloat(form.quantity)     : null,
        unit_price:   form.unit_price   ? parseFloat(form.unit_price)   : null,
        total_amount: parseFloat(form.total_amount),
      }
      await api.post(`/businesses/${bizId}/transactions`, payload)
      toast.success('Transaction successfully logged!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Record New Transaction</h2>
            <p className="text-xs text-slate-400">Add a sale or supplier purchase entry</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Transaction Date</label>
              <input type="date" className="input text-xs" value={form.date} onChange={set('date')} required />
            </div>
            <div>
              <label className="label">Transaction Type</label>
              <select className="input text-xs" value={form.type} onChange={set('type')}>
                <option value="sale">Sale (Customer Intake)</option>
                <option value="purchase">Purchase (Supplier Stock)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Item / Product Name</label>
              <input type="text" className="input text-xs" placeholder="e.g. Basmati Rice 5kg" value={form.product_name} onChange={set('product_name')} />
            </div>
            <div>
              <label className="label">Category</label>
              <input type="text" className="input text-xs" placeholder="e.g. Groceries" value={form.category} onChange={set('category')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input type="number" step="any" className="input text-xs" placeholder="1" value={form.quantity} onChange={set('quantity')} />
            </div>
            <div>
              <label className="label">Unit Price ({currency})</label>
              <input type="number" step="any" className="input text-xs" placeholder="0.00" value={form.unit_price} onChange={set('unit_price')} />
            </div>
            <div>
              <label className="label">Total Amount *</label>
              <input type="number" step="any" className="input text-xs font-bold" placeholder="0.00" value={form.total_amount} onChange={set('total_amount')} required />
            </div>
          </div>

          <div>
            <label className="label">Notes / Description (Optional)</label>
            <input type="text" className="input text-xs" placeholder="e.g. Paid via UPI, Bill #1042" value={form.description} onChange={set('description')} />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? 'Logging…' : 'Record Transaction'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Transactions() {
  const { activeBusiness } = useBusiness()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(false)
  const [filter, setFilter]             = useState('all')
  const [searchTerm, setSearchTerm]     = useState('')
  const [showModal, setShowModal]       = useState(false)

  const fetchTx = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      // Correct query parameter building
      const url = filter !== 'all'
        ? `/businesses/${activeBusiness.id}/transactions?type=${filter}&limit=200`
        : `/businesses/${activeBusiness.id}/transactions?limit=200`
      const r = await api.get(url)
      setTransactions(r.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeBusiness, filter])

  useEffect(() => { fetchTx() }, [fetchTx])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction record?')) return
    try {
      await api.delete(`/businesses/${activeBusiness.id}/transactions/${id}`)
      toast.success('Transaction deleted')
      fetchTx()
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  if (!activeBusiness) return <NoBusiness />
  const currency = activeBusiness.currency || 'INR'

  const filteredTransactions = transactions.filter(t => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (t.product_name && t.product_name.toLowerCase().includes(term)) ||
      (t.category && t.category.toLowerCase().includes(term)) ||
      (t.description && t.description.toLowerCase().includes(term))
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Ledger"
        subtitle={`Audit and manage raw sale and procurement records for ${activeBusiness.business_name}.`}
        badge={`${transactions.length} Records`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Record Transaction</span>
            </button>
          </div>
        }
      />

      {/* Filter and search bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input pl-9 text-xs py-2"
            placeholder="Search by product, category, notes…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'all', label: 'All' },
              { id: 'sale', label: 'Sales' },
              { id: 'purchase', label: 'Purchases' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <TransactionModal
          bizId={activeBusiness.id}
          currency={currency}
          onClose={() => setShowModal(false)}
          onSaved={fetchTx}
        />
      )}

      {loading ? <LoadingSpinner message="Querying ledger records…" /> : (
        <div className="card p-0 overflow-hidden shadow-card">
          {filteredTransactions.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No transactions found"
                message="Add your first transaction manually or import transactions via CSV or receipt OCR."
                action="/app/data-input"
                actionLabel="Import Data"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase tracking-wider font-semibold text-left">
                    <th className="py-3 pl-5">Date</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Product Item</th>
                    <th className="py-3">Category</th>
                    <th className="py-3 text-right">Quantity</th>
                    <th className="py-3 text-right">Unit Price</th>
                    <th className="py-3 text-right">Gross Total</th>
                    <th className="py-3 text-center">Channel</th>
                    <th className="py-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-5 font-medium text-slate-600 whitespace-nowrap">{t.date}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                          t.type === 'sale'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            : 'bg-primary-50 text-primary-700 border-primary-200/60'
                        }`}>
                          {t.type === 'sale' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-800 max-w-[160px] truncate">{t.product_name || '—'}</td>
                      <td className="py-3 text-slate-500 font-medium">{t.category || '—'}</td>
                      <td className="py-3 text-right text-slate-600 font-medium">
                        {t.quantity != null ? t.quantity.toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="py-3 text-right text-slate-600 font-medium">
                        {t.unit_price != null ? `₹${t.unit_price.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-900">
                        {fmt(t.total_amount, currency)}
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                          {t.source || 'manual'}
                        </span>
                      </td>
                      <td className="py-3 pr-5 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
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
      )}
    </div>
  )
}
