import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Pencil, AlertTriangle } from 'lucide-react'
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
      toast.success(product ? 'Product updated!' : 'Product added!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Product Name *</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <input className="input" placeholder="e.g. Grains" value={form.category} onChange={set('category')} />
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" placeholder="kg / piece / litre" value={form.unit} onChange={set('unit')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Selling Price</label>
              <input type="number" step="0.01" className="input" value={form.selling_price} onChange={set('selling_price')} />
            </div>
            <div>
              <label className="label">Cost Price</label>
              <input type="number" step="0.01" className="input" value={form.cost_price} onChange={set('cost_price')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Current Stock</label>
              <input type="number" step="0.01" className="input" value={form.current_stock} onChange={set('current_stock')} />
            </div>
            <div>
              <label className="label">Reorder Level</label>
              <input type="number" step="0.01" className="input" value={form.reorder_level} onChange={set('reorder_level')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Size (clothing)</label>
              <input className="input" placeholder="S / M / L / XL" value={form.size} onChange={set('size')} />
            </div>
            <div>
              <label className="label">Color (clothing)</label>
              <input className="input" placeholder="Blue, Red…" value={form.color} onChange={set('color')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : product ? 'Update' : 'Add Product'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
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
  const [modal, setModal]       = useState(null) // null | 'add' | product-obj

  const fetchProducts = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const r = await api.get(`/businesses/${activeBusiness.id}/products`)
      setProducts(r.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [activeBusiness])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/businesses/${activeBusiness.id}/products/${id}`)
      toast.success('Deleted')
      fetchProducts()
    } catch { toast.error('Delete failed') }
  }

  if (!activeBusiness) return <NoBusiness />

  const lowStock = products.filter(p => p.reorder_level > 0 && p.current_stock <= p.reorder_level)

  return (
    <div>
      <PageHeader
        title="Products & Inventory"
        subtitle="Manage your product catalogue and stock levels"
        actions={
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add Product
          </button>
        }
      />

      {modal && (
        <ProductModal
          bizId={activeBusiness.id}
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchProducts}
        />
      )}

      {lowStock.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>{lowStock.length} product(s)</strong> are below reorder level:{' '}
            {lowStock.map(p => p.name).join(', ')}
          </p>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          {products.length === 0 ? (
            <EmptyState title="No products" message="Add your products and set stock levels to get inventory alerts." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {['Name','Category','Unit','Selling ₹','Cost ₹','Stock','Reorder','Status',''].map(h => (
                    <th key={h} className="pb-2 font-medium text-gray-500 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const isLow = p.reorder_level > 0 && p.current_stock <= p.reorder_level
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{p.category || '—'}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{p.unit || '—'}</td>
                      <td className="py-2.5 pr-4 text-right">{p.selling_price?.toLocaleString() || '—'}</td>
                      <td className="py-2.5 pr-4 text-right">{p.cost_price?.toLocaleString() || '—'}</td>
                      <td className="py-2.5 pr-4 text-right font-medium">{p.current_stock}</td>
                      <td className="py-2.5 pr-4 text-right text-gray-500">{p.reorder_level}</td>
                      <td className="py-2.5 pr-4">
                        {isLow
                          ? <span className="badge-high">Low Stock</span>
                          : <span className="badge-low">OK</span>
                        }
                      </td>
                      <td className="py-2.5 flex gap-2">
                        <button onClick={() => setModal(p)} className="text-gray-300 hover:text-primary-600">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
