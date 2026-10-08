import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Pencil, AlertTriangle, Search, Package, CheckCircle2, X } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

function ProductModal({ bizId, product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product?.name || '', category: product?.category || '', unit: product?.unit || '',
    selling_price: product?.selling_price || '', cost_price: product?.cost_price || '',
    current_stock: product?.current_stock || 0, reorder_level: product?.reorder_level || 0,
    size: product?.size || '', color: product?.color || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
        cost_price:    form.cost_price    ? parseFloat(form.cost_price)    : null,
        current_stock: parseFloat(form.current_stock) || 0,
        reorder_level: parseFloat(form.reorder_level) || 0,
      }
      if (product) await api.put(`/businesses/${bizId}/products/${product.id}`, payload)
      else         await api.post(`/businesses/${bizId}/products`, payload)
      toast.success(product ? 'Product updated!' : 'Product added to catalogue!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-slate-50/70 backdrop-blur-md z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">{product ? 'Update Product Item' : 'New Catalogue Item'}</h2>
            <p className="text-xs text-slate-400">Configure prices and reorder safety thresholds</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Product Name *</label>
            <input className="input text-xs" placeholder="e.g. Organic Cotton T-Shirt" value={form.name} onChange={set('name')} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <input className="input text-xs" placeholder="e.g. Apparel / Groceries" value={form.category} onChange={set('category')} />
            </div>
            <div>
              <label className="label">Measurement Unit</label>
              <input className="input text-xs" placeholder="piece / kg / pack" value={form.unit} onChange={set('unit')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Selling Price (₹)</label>
              <input type="number" step="any" className="input text-xs font-semibold" value={form.selling_price} onChange={set('selling_price')} />
            </div>
            <div>
              <label className="label">Cost Price (₹)</label>
              <input type="number" step="any" className="input text-xs" value={form.cost_price} onChange={set('cost_price')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Current On-Hand Stock</label>
              <input type="number" step="any" className="input text-xs font-bold" value={form.current_stock} onChange={set('current_stock')} />
            </div>
            <div>
              <label className="label">Safety Reorder Threshold</label>
              <input type="number" step="any" className="input text-xs" value={form.reorder_level} onChange={set('reorder_level')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Size Variant (optional)</label>
              <input className="input text-xs" placeholder="S / M / L / XL" value={form.size} onChange={set('size')} />
            </div>
            <div>
              <label className="label">Color Variant (optional)</label>
              <input className="input text-xs" placeholder="Navy, Charcoal, etc." value={form.color} onChange={set('color')} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? 'Saving…' : product ? 'Update Item' : 'Add Item'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary py-2.5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const { activeBusiness } = useBusiness()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(false)
  const [modal, setModal]       = useState(null)
  const [search, setSearch]     = useState('')

  const fetchProducts = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const r = await api.get(`/businesses/${activeBusiness.id}/products`)
      setProducts(r.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeBusiness])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this product?')) return
    try {
      await api.delete(`/businesses/${activeBusiness.id}/products/${id}`)
      toast.success('Product deleted')
      fetchProducts()
    } catch {
      toast.error('Delete failed')
    }
  }

  if (!activeBusiness) return <NoBusiness />
  const currency = activeBusiness.currency || 'INR'

  const lowStock = products.filter(p => p.reorder_level > 0 && p.current_stock <= p.reorder_level)
  const healthyCount = products.length - lowStock.length

  const filtered = products.filter(p => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.category && p.category.toLowerCase().includes(s))
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Product Catalogue"
        subtitle={`Track SKU levels, margins, and automatic replenishment triggers for ${activeBusiness.business_name}.`}
        badge={`${products.length} Products`}
        actions={
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} />
            <span>Add Product</span>
          </button>
        }
      />

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total SKUs Tracked</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{products.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Package size={18} />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Healthy Stock Level</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{healthyCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Replenishment Alerts</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{lowStock.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
        </div>
      </div>

      {modal && (
        <ProductModal
          bizId={activeBusiness.id}
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchProducts}
        />
      )}

      {/* Search Bar */}
      <div className="card p-4 flex items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input pl-9 text-xs py-2"
            placeholder="Search products by name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? <LoadingSpinner message="Loading product catalogue…" /> : (
        <div className="card p-0 overflow-hidden shadow-card">
          {filtered.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No products catalogue found"
                message="Add your inventory items with reorder limits to enable automatic low-stock alarms."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase tracking-wider font-semibold text-left">
                    <th className="py-3 pl-5">Product Name</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Unit</th>
                    <th className="py-3 text-right">Selling Price</th>
                    <th className="py-3 text-right">Cost Price</th>
                    <th className="py-3 text-right">Current Stock</th>
                    <th className="py-3 text-right">Reorder Mark</th>
                    <th className="py-3 text-center">Status</th>
                    <th className="py-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filtered.map(p => {
                    const isLow = p.reorder_level > 0 && p.current_stock <= p.reorder_level
                    const isZero = p.current_stock <= 0
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pl-5 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 text-slate-500 font-medium">{p.category || '—'}</td>
                        <td className="py-3 text-slate-400">{p.unit || '—'}</td>
                        <td className="py-3 text-right font-semibold text-slate-800">
                          {p.selling_price != null ? `₹${p.selling_price.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3 text-right text-slate-500 font-medium">
                          {p.cost_price != null ? `₹${p.cost_price.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3 text-right font-black text-slate-900">
                          {p.current_stock?.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {p.reorder_level?.toLocaleString()}
                        </td>
                        <td className="py-3 text-center">
                          {isZero ? (
                            <span className="badge-high text-[10px]">Out of Stock</span>
                          ) : isLow ? (
                            <span className="badge-high text-[10px]">Low Stock</span>
                          ) : (
                            <span className="badge-low text-[10px]">Optimal</span>
                          )}
                        </td>
                        <td className="py-3 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setModal(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 transition-colors"
                              title="Edit item"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
