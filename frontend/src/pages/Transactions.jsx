import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Filter } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

const fmt = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) ?? '—'

function TransactionModal({ bizId, onClose, onSaved }) {
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
      toast.success('Transaction added!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2>Add Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={set('date')} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={set('type')}>
                <option value="sale">Sale</option>
                <option value="purchase">Purchase</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Product Name</label>
              <input type="text" className="input" placeholder="e.g. Basmati Rice" value={form.product_name} onChange={set('product_name')} />
            </div>
            <div>
              <label className="label">Category</label>
              <input type="text" className="input" placeholder="e.g. Grains" value={form.category} onChange={set('category')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input type="number" step="0.01" className="input" placeholder="0" value={form.quantity} onChange={set('quantity')} />
            </div>
            <div>
              <label className="label">Unit Price</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={form.unit_price} onChange={set('unit_price')} />
            </div>
            <div>
              <label className="label">Total Amount *</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={form.total_amount} onChange={set('total_amount')} required />
            </div>
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input type="text" className="input" placeholder="Optional notes" value={form.description} onChange={set('description')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Add Transaction'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
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
  const [showModal, setShowModal]       = useState(false)

  const fetchTx = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?type=${filter}` : ''
      const r = await api.get(`/businesses/${activeBusiness.id}/transactions${params}&limit=200`)
      setTransactions(r.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeBusiness, filter])

  useEffect(() => { fetchTx() }, [fetchTx])

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await api.delete(`/businesses/${activeBusiness.id}/transactions/${id}`)
      toast.success('Deleted')
      fetchTx()
    } catch { toast.error('Delete failed') }
  }

  if (!activeBusiness) return <NoBusiness />

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="All sales and purchase records"
        actions={
          <div className="flex items-center gap-2">
            <select className="input w-auto text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="sale">Sales</option>
              <option value="purchase">Purchases</option>
            </select>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={15} /> Add
            </button>
          </div>
        }
      />

      {showModal && (
        <TransactionModal bizId={activeBusiness.id} onClose={() => setShowModal(false)} onSaved={fetchTx} />
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          {transactions.length === 0 ? (
            <EmptyState title="No transactions" message="Add your first transaction manually or upload a CSV." action="/app/data-input" actionLabel="Add Data" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {['Date','Type','Product','Category','Qty','Unit Price','Total','Source',''].map(h => (
                    <th key={h} className="pb-2 font-medium text-gray-500 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-4 whitespace-nowrap">{t.date}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 max-w-[140px] truncate">{t.product_name || '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{t.category || '—'}</td>
                    <td className="py-2.5 pr-4 text-right">{fmt(t.quantity)}</td>
                    <td className="py-2.5 pr-4 text-right">{fmt(t.unit_price)}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold">{fmt(t.total_amount)}</td>
                    <td className="py-2.5 pr-4"><span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{t.source}</span></td>
                    <td className="py-2.5">
                      <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
